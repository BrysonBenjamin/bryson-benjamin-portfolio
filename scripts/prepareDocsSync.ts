import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

const docsDir = resolve(import.meta.dir, "../docs");
const outPath = resolve(import.meta.dir, "../docs-sync-payload.json");

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(text: string): string {
  const match = text.match(/^(.*?[.!?])(\s|$)/s);
  return (match ? match[1] : text).trim();
}

function escapeYamlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toMdx(markdown: string, slug: string): string {
  const lines = markdown.split("\n");

  if (!lines[0]?.startsWith("# ")) {
    throw new Error(`docs/${slug}.md must start with a single "# Title" heading`);
  }

  const title = lines[0].slice(2).trim();

  let bodyStart = 1;
  while (bodyStart < lines.length && lines[bodyStart]?.trim() === "") {
    bodyStart += 1;
  }

  let paragraphEnd = bodyStart;
  while (paragraphEnd < lines.length && lines[paragraphEnd]?.trim() !== "") {
    paragraphEnd += 1;
  }

  const firstParagraph = lines.slice(bodyStart, paragraphEnd).join(" ");
  const description = firstSentence(stripInlineMarkdown(firstParagraph));

  // Cross-doc links point at sibling docs/*.md files locally; once forwarded
  // those siblings are sibling pages under /docs/guides instead.
  const body = lines
    .slice(bodyStart)
    .join("\n")
    .replace(/\]\(\.\/([a-zA-Z0-9_-]+)\.md(#[^)]*)?\)/g, "](/docs/guides/$1$2)")
    .trimStart();

  const frontmatter = ["---", `title: "${escapeYamlString(title)}"`, `description: "${escapeYamlString(description)}"`, "---"].join(
    "\n"
  );

  return `${frontmatter}\n\n${body}\n`;
}

async function main() {
  const entries = await readdir(docsDir, { withFileTypes: true });
  const mdFiles = entries
    .filter((entry) => entry.isFile() && extname(entry.name) === ".md")
    .map((entry) => entry.name)
    .sort();

  const files = await Promise.all(
    mdFiles.map(async (name) => {
      const slug = basename(name, ".md");
      const markdown = await readFile(resolve(docsDir, name), "utf8");
      return {
        path: `guides/${slug}.mdx`,
        content: toMdx(markdown, slug)
      };
    })
  );

  await writeFile(outPath, `${JSON.stringify({ files }, null, 2)}\n`);
  console.log(`Wrote ${files.length} doc(s) to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
