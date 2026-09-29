import { Locale } from '../types/common.types';
import {
  NewRecentProject,
  RecentProject,
  RecentProjectFilters,
  RecentProjectUpdate,
} from '../types/recentProject.types';
import { RecentProjectServiceDeps } from '../types/service.types';
import { AppError } from '../utils/errors';

const notFound = (id: number) => new AppError(`recent project with id ${id} not found`, 404, 'not_found');

export function createRecentProjectService({ recentProjects, files }: RecentProjectServiceDeps) {
  async function checkImage(imageId: number | null | undefined): Promise<void> {
    if (imageId === null || imageId === undefined) return;
    await files.requireMedia(imageId);
  }

  return {
    listPublic(locale: Locale): Promise<RecentProject[]> {
      return recentProjects.index({ locale, includeUnpublished: false });
    },

    listAll(filters: RecentProjectFilters): Promise<RecentProject[]> {
      return recentProjects.index({ ...filters, includeUnpublished: true });
    },

    async getProject(id: number): Promise<RecentProject> {
      const project = await recentProjects.show(id);
      if (!project) throw notFound(id);
      return project;
    },

    async createProject(input: NewRecentProject): Promise<RecentProject> {
      await checkImage(input.imageId);
      return recentProjects.create(input);
    },

    async updateProject(id: number, changes: RecentProjectUpdate): Promise<RecentProject> {
      await checkImage(changes.imageId);
      const updated = await recentProjects.update(id, changes);
      if (!updated) throw notFound(id);
      return updated;
    },

    async deleteProject(id: number): Promise<RecentProject> {
      const existing = await recentProjects.show(id);
      if (!existing) throw notFound(id);
      await recentProjects.delete(id);
      return existing;
    },

    async reorder(locale: Locale, ids: number[]): Promise<RecentProject[]> {
      await recentProjects.setOrder(locale, ids);
      return recentProjects.index({ locale, includeUnpublished: true });
    },
  };
}

export type RecentProjectService = ReturnType<typeof createRecentProjectService>;
