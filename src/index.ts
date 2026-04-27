import { Worker } from "@notionhq/workers";
import { j } from "@notionhq/workers/schema-builder";
import type { Client } from "@notionhq/client";

const worker = new Worker();
export default worker;

const RICH_TEXT_LIMIT = 2000;
const TOGGLE_CHILDREN_LIMIT = 100;
const SUPADATA_ENDPOINT = "https://api.supadata.ai/v1/transcript";
const URL_PROPERTY_CANDIDATES = ["URL", "Url", "url", "Link", "YouTube URL", "Video URL"];

type NotionClient = InstanceType<typeof Client>;

interface SupadataTextResponse {
	content: string;
	lang: string;
	availableLangs?: string[];
}

async function fetchTranscriptFromSupadata(
	videoUrl: string,
	lang: string | null,
	apiKey: string,
): Promise<SupadataTextResponse> {
	const params = new URLSearchParams({ url: videoUrl, text: "true", mode: "auto" });
	if (lang) params.set("lang", lang);

	const res = await fetch(`${SUPADATA_ENDPOINT}?${params.toString()}`, {
		headers: { "x-api-key": apiKey },
	});

	if (res.status === 202) {
		throw new Error(
			"Supadata hat einen asynchronen Job gestartet (HTTP 202). Dieser Worker unterstützt Async-Jobs noch nicht.",
		);
	}
	if (res.status === 206) {
		throw new Error("Kein Transkript für dieses Video verfügbar (HTTP 206).");
	}
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(
			`Supadata-Request fehlgeschlagen: HTTP ${res.status}. Body: ${body.slice(0, 500)}`,
		);
	}

	return (await res.json()) as SupadataTextResponse;
}

function splitTextIntoChunks(text: string, maxLength: number): string[] {
	const chunks: string[] = [];
	let remaining = text;
	while (remaining.length > 0) {
		if (remaining.length <= maxLength) {
			chunks.push(remaining);
			break;
		}
		let splitAt = remaining.lastIndexOf("\n", maxLength);
		if (splitAt === -1 || splitAt === 0) {
			splitAt = remaining.lastIndexOf(" ", maxLength);
		}
		if (splitAt === -1 || splitAt === 0) {
			splitAt = maxLength;
		}
		chunks.push(remaining.slice(0, splitAt));
		remaining = remaining.slice(splitAt).trimStart();
	}
	return chunks;
}

function normalizePageId(raw: string): string {
	if (!raw) throw new Error("pageId ist leer.");
	const trimmed = raw.trim();

	// Wenn es eine Notion-URL ist, die ID am Ende extrahieren
	const urlMatch = trimmed.match(/([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[?#]|$)/i);
	const candidate = urlMatch ? urlMatch[1] : trimmed;

	// Bindestriche entfernen, nur Hex-Zeichen behalten
	const hex = candidate.replace(/-/g, "").toLowerCase();
	if (!/^[0-9a-f]{32}$/.test(hex)) {
		throw new Error(
			`Ungültige pageId: "${raw}". Erwartet wird eine Notion Page-ID (32 Hex-Zeichen, mit oder ohne Bindestriche) oder eine Notion-URL.`,
		);
	}

	// In UUID-Form bringen: 8-4-4-4-12
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function findUrlOnPage(
	notion: NotionClient,
	pageId: string,
): Promise<{ url: string; propertyName: string }> {
	const page = await notion.pages.retrieve({ page_id: pageId });
	if (!("properties" in page)) {
		throw new Error("Notion-Seite hat keine Properties (evtl. unzureichende Rechte).");
	}
	const properties = page.properties as Record<string, { type: string; url?: string | null; rich_text?: Array<{ plain_text: string }> }>;

	// 1) Bevorzugt eine URL-Property mit einem der üblichen Namen
	for (const name of URL_PROPERTY_CANDIDATES) {
		const prop = properties[name];
		if (prop?.type === "url" && prop.url) return { url: prop.url, propertyName: name };
	}

	// 2) Ansonsten irgendeine URL-Property mit Wert
	for (const [name, prop] of Object.entries(properties)) {
		if (prop.type === "url" && prop.url) return { url: prop.url, propertyName: name };
	}

	// 3) Fallback: rich_text Properties nach YouTube-URL durchsuchen
	for (const [name, prop] of Object.entries(properties)) {
		if (prop.type === "rich_text" && prop.rich_text) {
			const combined = prop.rich_text.map((rt) => rt.plain_text).join("");
			const match = combined.match(/https?:\/\/\S+/);
			if (match) return { url: match[0], propertyName: name };
		}
	}

	throw new Error(
		"Keine URL in den Properties dieser Seite gefunden. Erwartet wird eine URL-Property (z.B. 'URL' oder 'Link').",
	);
}

worker.tool("fetchTranscript", {
	title: "YouTube-Transkript in Notion-Seite einfügen",
	description:
		"Liest die URL aus einer Notion-Seite, ruft das Transkript via Supadata ab und hängt es als Toggle-Block auf der Seite an.",
	schema: j.object({
		pageId: j
			.string()
			.describe("Die Notion Page-ID der Ressource (Seite muss eine URL-Property mit der Video-URL haben)"),
		lang: j
			.string()
			.describe("Sprachcode (z.B. 'de' oder 'en'). Leer lassen für Auto-Detection.")
			.nullable(),
	}),
	execute: async ({ pageId, lang }, { notion }) => {
		const apiKey = process.env.SUPADATA_API_KEY;
		if (!apiKey) {
			throw new Error(
				"SUPADATA_API_KEY ist nicht gesetzt. Lokal: .env-Datei. Remote: `ntn workers env push`.",
			);
		}

		console.log(`[fetchTranscript] Eingangs-pageId: "${pageId}"`);
		const normalizedPageId = normalizePageId(pageId);
		console.log(`[fetchTranscript] Normalisierte pageId: ${normalizedPageId}`);

		// Check: existiert bereits ein Toggle "Transkript" auf der Seite?
		// Vermeidet doppelte Transkripte bei Mehrfach-Triggern und spart Supadata-Credits.
		const existingChildren = await notion.blocks.children.list({
			block_id: normalizedPageId,
			page_size: 100,
		});
		const hasExistingTranscript = existingChildren.results.some((block) => {
			if (!("type" in block) || block.type !== "toggle") return false;
			const toggle = (block as { toggle?: { rich_text?: Array<{ plain_text?: string }> } }).toggle;
			const title = toggle?.rich_text?.map((rt) => rt.plain_text ?? "").join("").trim();
			return title === "Transkript";
		});
		if (hasExistingTranscript) {
			return "Auf dieser Seite existiert bereits ein Toggle-Block 'Transkript'. Kein neues Transkript eingefügt.";
		}

		const { url: videoUrl, propertyName } = await findUrlOnPage(notion, normalizedPageId);

		const result = await fetchTranscriptFromSupadata(videoUrl, lang, apiKey);
		const transcript = result.content?.trim() ?? "";
		if (!transcript) {
			return "Supadata hat ein leeres Transkript zurückgegeben.";
		}

		const chunks = splitTextIntoChunks(transcript, RICH_TEXT_LIMIT);
		const paragraphBlocks = chunks.map((chunk) => ({
			object: "block" as const,
			type: "paragraph" as const,
			paragraph: {
				rich_text: [{ type: "text" as const, text: { content: chunk } }],
			},
		}));

		// Toggle-Block mit den ersten bis zu 100 Paragraphen als Children.
		// Notion erlaubt beim append max. 100 Children pro Block — weitere Paragraphs
		// werden nach dem Erstellen an den Toggle appended.
		const firstBatch = paragraphBlocks.slice(0, TOGGLE_CHILDREN_LIMIT);
		const remainingBatches: typeof paragraphBlocks[] = [];
		for (let i = TOGGLE_CHILDREN_LIMIT; i < paragraphBlocks.length; i += TOGGLE_CHILDREN_LIMIT) {
			remainingBatches.push(paragraphBlocks.slice(i, i + TOGGLE_CHILDREN_LIMIT));
		}

		const toggleBlock = {
			object: "block" as const,
			type: "toggle" as const,
			toggle: {
				rich_text: [{ type: "text" as const, text: { content: "Transkript" } }],
				children: firstBatch,
			},
		};

		const appendResult = await notion.blocks.children.append({
			block_id: normalizedPageId,
			children: [toggleBlock],
		});

		const createdToggle = appendResult.results?.[0];
		if (remainingBatches.length > 0 && createdToggle?.id) {
			for (const batch of remainingBatches) {
				await notion.blocks.children.append({
					block_id: createdToggle.id,
					children: batch,
				});
			}
		}

		// Status setzen (nur wenn STATUS_AFTER_TRANSCRIPT in .env gesetzt ist und die Status-Property existiert).
		// Leer lassen oder weglassen = Status-Update wird übersprungen.
		const statusName = process.env.STATUS_AFTER_TRANSCRIPT?.trim();
		let statusUpdated = false;
		if (statusName) {
			try {
				await notion.pages.update({
					page_id: normalizedPageId,
					properties: {
						Status: { status: { name: statusName } },
					},
				});
				statusUpdated = true;
			} catch (e) {
				console.log(`[Status-Update] Fehler: ${e}`);
			}
		}

		const statusMsg = !statusName
			? "kein Status-Update konfiguriert"
			: statusUpdated
				? `Status auf "${statusName}" gesetzt`
				: `Status-Update auf "${statusName}" fehlgeschlagen (Property/Option vorhanden?)`;
		return `Transkript eingefügt: URL aus Property "${propertyName}", Sprache "${result.lang}", ${transcript.length} Zeichen in ${chunks.length} Absätze(n). ${statusMsg}.`;
	},
});
