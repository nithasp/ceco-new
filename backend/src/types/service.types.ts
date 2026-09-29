import { AuditLogRepository } from '../repositories/auditLog.repository';
import { SiteDocumentRepository } from '../repositories/document.repository';
import { ExperienceRepository } from '../repositories/experience.repository';
import { HeaderRepository } from '../repositories/header.repository';
import { MediaRepository } from '../repositories/media.repository';
import { RecentProjectRepository } from '../repositories/recentProject.repository';
import { RecruitmentRepository } from '../repositories/recruitment.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { UserRepository } from '../repositories/user.repository';
import { NewAuditLog } from './auditLog.types';
import { TokenPair } from './auth.types';
import { Media } from './media.types';
import { StorageDriver } from './storage.types';
import { PublicUser } from './user.types';

export interface EventRecorder {
  recordEvent(entry: NewAuditLog): void;
}

export interface SessionIssuer {
  issueSession(user: PublicUser): Promise<TokenPair>;
  revokeAllSessions(userId: number): Promise<void>;
}

// Content services check an attached file exists before they store its id, so a bad reference is a
// 400 rather than a broken image on the site
export interface MediaLookup {
  findMedia(id: number): Promise<Media | null>;
  requireMedia(id: number): Promise<Media>;
}

export interface AuditServiceDeps {
  auditLogs: Pick<AuditLogRepository, 'create' | 'index' | 'count' | 'deleteOlderThan'>;
}

export interface TokenServiceDeps {
  refreshTokens: Pick<
    RefreshTokenRepository,
    | 'create'
    | 'consume'
    | 'findUsed'
    | 'deleteFamily'
    | 'deleteFamilyOf'
    | 'deleteAllForUser'
    | 'deleteExpired'
  >;
  users: Pick<UserRepository, 'show'>;
  audit: EventRecorder;
}

export interface UserServiceDeps {
  users: Pick<
    UserRepository,
    | 'index'
    | 'count'
    | 'show'
    | 'findByUsername'
    | 'findCredentials'
    | 'findCredentialsById'
    | 'create'
    | 'updateProfile'
    | 'updatePassword'
    | 'updateRole'
  >;
  tokens: SessionIssuer;
}

export interface MediaServiceDeps {
  media: Pick<
    MediaRepository,
    'index' | 'count' | 'show' | 'create' | 'update' | 'delete' | 'countReferences'
  >;
  storage: StorageDriver;
}

export interface HeaderServiceDeps {
  headers: Pick<
    HeaderRepository,
    | 'index'
    | 'findByLocale'
    | 'show'
    | 'create'
    | 'update'
    | 'delete'
    | 'listSlides'
    | 'findSlide'
    | 'slideHeaderId'
    | 'createSlide'
    | 'updateSlide'
    | 'deleteSlide'
    | 'setSlideOrder'
  >;
  files: MediaLookup;
}

export interface RecentProjectServiceDeps {
  recentProjects: Pick<
    RecentProjectRepository,
    'index' | 'count' | 'show' | 'create' | 'update' | 'delete' | 'setOrder'
  >;
  files: MediaLookup;
}

export interface ExperienceServiceDeps {
  experiences: Pick<
    ExperienceRepository,
    | 'index'
    | 'findByType'
    | 'show'
    | 'create'
    | 'update'
    | 'delete'
    | 'findCompany'
    | 'companyExperienceId'
    | 'createCompany'
    | 'updateCompany'
    | 'deleteCompany'
    | 'setCompanyOrder'
    | 'listWorks'
    | 'findWork'
    | 'workCompanyId'
    | 'createWork'
    | 'updateWork'
    | 'deleteWork'
    | 'setWorkOrder'
  >;
}

export interface RecruitmentServiceDeps {
  recruitments: Pick<
    RecruitmentRepository,
    'index' | 'count' | 'show' | 'create' | 'update' | 'delete' | 'setOrder'
  >;
}

export interface SiteDocumentServiceDeps {
  documents: Pick<
    SiteDocumentRepository,
    'index' | 'show' | 'findByName' | 'findFirst' | 'create' | 'update' | 'delete'
  >;
  files: MediaLookup;
}
