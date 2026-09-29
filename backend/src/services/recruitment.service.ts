import { Locale } from '../types/common.types';
import {
  NewRecruitment,
  Recruitment,
  RecruitmentFilters,
  RecruitmentUpdate,
} from '../types/recruitment.types';
import { RecruitmentServiceDeps } from '../types/service.types';
import { AppError } from '../utils/errors';

const notFound = (id: number) => new AppError(`job with id ${id} not found`, 404, 'not_found');

export function createRecruitmentService({ recruitments }: RecruitmentServiceDeps) {
  return {
    listPublic(locale: Locale): Promise<Recruitment[]> {
      return recruitments.index({ locale, includeUnpublished: false });
    },

    listAll(filters: RecruitmentFilters): Promise<Recruitment[]> {
      return recruitments.index({ ...filters, includeUnpublished: true });
    },

    async getJob(id: number): Promise<Recruitment> {
      const job = await recruitments.show(id);
      if (!job) throw notFound(id);
      return job;
    },

    createJob(input: NewRecruitment): Promise<Recruitment> {
      return recruitments.create(input);
    },

    async updateJob(id: number, changes: RecruitmentUpdate): Promise<Recruitment> {
      const updated = await recruitments.update(id, changes);
      if (!updated) throw notFound(id);
      return updated;
    },

    async deleteJob(id: number): Promise<Recruitment> {
      const existing = await recruitments.show(id);
      if (!existing) throw notFound(id);
      await recruitments.delete(id);
      return existing;
    },

    async reorder(locale: Locale, ids: number[]): Promise<Recruitment[]> {
      await recruitments.setOrder(locale, ids);
      return recruitments.index({ locale, includeUnpublished: true });
    },
  };
}

export type RecruitmentService = ReturnType<typeof createRecruitmentService>;
