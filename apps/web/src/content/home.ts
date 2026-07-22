import type { BadgeTone } from "../components/ui/Badge";
import {
  publicPosts,
  publicProjects,
  publicStatusNotes,
  type PublicPost,
  type PublicProject,
  type PublicStatusNote
} from "@bryson-benjamin/portfolio-content";

export type Project = Omit<PublicProject, "badge"> & { badge: { label: string; tone: BadgeTone } };
export type Post = PublicPost;
export type StatusNote = PublicStatusNote;

export const projects: readonly Project[] = publicProjects;
export const posts: readonly Post[] = publicPosts;
export const statusNotes: readonly StatusNote[] = publicStatusNotes;
