export interface ManuscriptChapter {
  title: string;
  body: string;
}

export function compileManuscript(manuscriptName: string, chapters: ManuscriptChapter[]): string {
  const sections = chapters.map((chapter) => `## ${chapter.title}\n\n${chapter.body.trim()}\n`);
  return `# ${manuscriptName}\n\n${sections.join("\n\n")}`;
}
