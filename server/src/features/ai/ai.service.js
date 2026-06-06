import Groq from 'groq-sdk';
import prisma from '../../config/prisma.js';
import { GROQ_MODEL } from '../../config/env.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function assertProjectOwner(projectId, userId) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  return project;
}

function buildContext(papers) {
  if (!papers.length) return 'No papers have been imported into this project yet.';
  return papers.map(p =>
    `[ID:${p.id}] ${p.title} (${p.authors || 'Unknown authors'}, ${p.year || 'n.d.'}) — Status: ${p.status}` +
    (p.abstract ? `\nAbstract: ${p.abstract}` : '')
  ).join('\n\n');
}

export async function chat(projectId, userId, userMessage) {
  const project = await assertProjectOwner(projectId, userId);

  const papers = await prisma.paper.findMany({
    where: { projectId },
    select: { id: true, title: true, authors: true, year: true, abstract: true, status: true },
  });

  const history = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const systemPrompt = `You are a research assistant for a systematic literature review project titled "${project.name}".
You have access to the following papers in the corpus:

${buildContext(papers)}

Rules:
- Only reference papers listed above. Never invent citations.
- When citing a paper, include its ID in brackets e.g. [ID:abc123].
- Be concise and academic in tone.
- If asked about papers not in the corpus, say they are not in the library.`;

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });

  const assistantMessage = response.choices[0].message.content;

  await prisma.chatMessage.createMany({
    data: [
      { projectId, role: 'user',      content: userMessage },
      { projectId, role: 'assistant', content: assistantMessage },
    ],
  });

  return { message: assistantMessage };
}

export async function getHistory(projectId, userId) {
  await assertProjectOwner(projectId, userId);
  return prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
}
