import { Locale } from '../types/common.types';
import {
  Experience,
  ExperienceCompany,
  ExperienceCompanyUpdate,
  ExperienceFilters,
  ExperienceType,
  ExperienceUpdate,
  ExperienceWork,
  ExperienceWorkUpdate,
  NewExperience,
  NewExperienceCompany,
  NewExperienceWork,
} from '../types/experience.types';
import { ExperienceServiceDeps } from '../types/service.types';
import { AppError } from '../utils/errors';

const notFound = (id: number) => new AppError(`experience with id ${id} not found`, 404, 'not_found');
const companyNotFound = (id: number) => new AppError(`company with id ${id} not found`, 404, 'not_found');
const workNotFound = (id: number) => new AppError(`work item with id ${id} not found`, 404, 'not_found');

export function createExperienceService({ experiences }: ExperienceServiceDeps) {
  async function requireExperience(id: number): Promise<Experience> {
    const experience = await experiences.show(id);
    if (!experience) throw notFound(id);
    return experience;
  }

  async function requireCompany(id: number): Promise<ExperienceCompany> {
    const company = await experiences.findCompany(id);
    if (!company) throw companyNotFound(id);
    return company;
  }

  return {
    requireExperience,
    requireCompany,

    listPublic(locale: Locale): Promise<Experience[]> {
      return experiences.index({ locale });
    },

    getByType(type: ExperienceType, locale: Locale): Promise<Experience | null> {
      return experiences.findByType(type, locale);
    },

    listAll(filters: ExperienceFilters): Promise<Experience[]> {
      return experiences.index(filters);
    },

    // One row per type and locale: a second one would make the service page pick arbitrarily
    async createExperience(input: NewExperience): Promise<Experience> {
      const existing = await experiences.findByType(input.type, input.locale);
      if (existing) {
        throw new AppError(
          `A "${input.type}" table already exists for locale "${input.locale}"`,
          409,
          'conflict',
        );
      }
      return experiences.create(input);
    },

    async updateExperience(id: number, changes: ExperienceUpdate): Promise<Experience> {
      const current = await requireExperience(id);

      if (changes.type && changes.type !== current.type) {
        const clash = await experiences.findByType(changes.type, current.locale);
        if (clash) {
          throw new AppError(
            `A "${changes.type}" table already exists for locale "${current.locale}"`,
            409,
            'conflict',
          );
        }
      }

      const updated = await experiences.update(id, changes);
      if (!updated) throw notFound(id);
      return updated;
    },

    async deleteExperience(id: number): Promise<Experience> {
      const existing = await requireExperience(id);
      await experiences.delete(id);
      return existing;
    },

    // ---- companies --------------------------------------------------------

    async addCompany(experienceId: number, input: NewExperienceCompany): Promise<ExperienceCompany> {
      await requireExperience(experienceId);
      return experiences.createCompany(experienceId, input);
    },

    async updateCompany(id: number, changes: ExperienceCompanyUpdate): Promise<ExperienceCompany> {
      const updated = await experiences.updateCompany(id, changes);
      if (!updated) throw companyNotFound(id);
      return updated;
    },

    async deleteCompany(id: number): Promise<ExperienceCompany> {
      const existing = await requireCompany(id);
      await experiences.deleteCompany(id);
      return existing;
    },

    async reorderCompanies(experienceId: number, ids: number[]): Promise<Experience> {
      await requireExperience(experienceId);
      await experiences.setCompanyOrder(experienceId, ids);
      return requireExperience(experienceId);
    },

    // ---- work rows --------------------------------------------------------

    async addWork(companyId: number, input: NewExperienceWork): Promise<ExperienceWork> {
      await requireCompany(companyId);
      return experiences.createWork(companyId, input);
    },

    async updateWork(id: number, changes: ExperienceWorkUpdate): Promise<ExperienceWork> {
      const updated = await experiences.updateWork(id, changes);
      if (!updated) throw workNotFound(id);
      return updated;
    },

    async deleteWork(id: number): Promise<ExperienceWork> {
      const existing = await experiences.findWork(id);
      if (!existing) throw workNotFound(id);
      await experiences.deleteWork(id);
      return existing;
    },

    async reorderWorks(companyId: number, ids: number[]): Promise<ExperienceWork[]> {
      await requireCompany(companyId);
      await experiences.setWorkOrder(companyId, ids);
      return experiences.listWorks(companyId);
    },
  };
}

export type ExperienceService = ReturnType<typeof createExperienceService>;
