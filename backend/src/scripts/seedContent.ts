import fs from 'fs/promises';
import path from 'path';
import db, { closeDatabase } from '../database';
import { HeaderRepository } from '../repositories/header.repository';
import {
  documentService,
  experienceService,
  headerService,
  mediaService,
  recentProjectService,
  recruitmentService,
} from '../services';
import { Locale } from '../types/common.types';
import { EXPERIENCE_TYPES } from '../types/experience.types';
import { Media } from '../types/media.types';

// The old CMS is gone, so the site's own assets and translation files are the source. Anything that
// existed only in the old database is seeded as a clearly-labelled example for the editor to replace.
const ASSETS = path.resolve(process.cwd(), '..', 'frontend', 'assets', 'images');

const MIME_BY_EXT: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

const EXAMPLE_LABEL: Record<Locale, string> = {
  th: 'ตัวอย่าง — แก้ไขได้ในหน้าผู้ดูแลระบบ',
  en: 'Example — edit this in the admin pages',
};

interface SlideSeed {
  file: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

const HERO_SLIDES: SlideSeed[] = [
  {
    file: 'output/carousal-1.webp',
    title: {
      th: 'ยินดีต้อนรับสู่ CECO',
      en: 'Welcome to Collective Engineering Co.,Ltd.',
    },
    description: {
      th: 'บริษัท คอลเลคทีฟ เอ็นจิเนียริ่ง จำกัด ก้าวสู่ปีที่ 29 ผู้ให้บริการด้านวิศวกรรมไฟฟ้าแรงดันสูงครบวงจร',
      en: '29th Years of High voltage solution provider.',
    },
  },
  {
    file: 'output/carousal-2.webp',
    title: {
      th: 'การติดตั้งอุปกรณ์สำหรับระบบไฟฟ้าแรงดันสูง',
      en: 'High voltage equipment installation',
    },
    description: {
      th: 'เราคือทีมงานมืออาชีพ ที่สามารถติดตั้งอุปกรณ์สำหรับระบบไฟฟ้าแรงดันสูงในโรงไฟฟ้า สถานีไฟฟ้าย่อย ได้อย่างครบวงจร',
      en: 'A professional team delivering complete installation for power plants and substations.',
    },
  },
  {
    file: 'output/carousal-2-1.webp',
    title: {
      th: 'การบำรุงรักษาระบบและอุปกรณ์ไฟฟ้าแรงดันสูง',
      en: 'High voltage maintenance',
    },
    description: {
      th: 'การบำรุงรักษาตามกำหนดการอย่างสม่ำเสมอ ช่วยป้องกันระบบไฟฟ้าล้มเหลวโดยมิได้คาดหมาย',
      en: 'Scheduled preventive maintenance that keeps an unexpected failure from happening.',
    },
  },
];

// The six project images the site ships with. Their titles describe the service each one shows;
// the editor is expected to replace them with the real project names.
const RECENT_PROJECTS: SlideSeed[] = [
  {
    file: 'ceco-img/Sp1.webp',
    title: { th: 'งานติดตั้งสถานีไฟฟ้าย่อย', en: 'Substation installation' },
    description: {
      th: 'งานติดตั้งอุปกรณ์ไฟฟ้าแรงดันสูงในสถานีไฟฟ้าย่อย',
      en: 'High voltage equipment installation at a substation.',
    },
  },
  {
    file: 'ceco-img/Sp2.webp',
    title: { th: 'งานออกแบบระบบป้องกัน', en: 'Protection system design' },
    description: {
      th: 'งานออกแบบและคำนวณระบบป้องกันทางวิศวกรรมไฟฟ้า',
      en: 'Engineering design and calculation for an electrical protection system.',
    },
  },
  {
    file: 'ceco-img/Sp3.webp',
    title: { th: 'งานทดสอบตรวจสอบระบบไฟฟ้า', en: 'Testing and commissioning' },
    description: {
      th: 'งานทดสอบตรวจสอบอุปกรณ์และระบบไฟฟ้าแรงสูงก่อนจ่ายไฟ',
      en: 'Testing and commissioning of high voltage equipment before energising.',
    },
  },
  {
    file: 'ceco-img/Sp4.webp',
    title: { th: 'งานบำรุงรักษาเชิงป้องกัน', en: 'Preventive maintenance' },
    description: {
      th: 'งานตรวจสอบและบำรุงรักษาระบบไฟฟ้าประจำปี',
      en: 'Annual inspection and preventive maintenance of an electrical system.',
    },
  },
  {
    file: 'ceco-img/Sp5.webp',
    title: { th: 'งานระบบไฟฟ้าในโรงไฟฟ้า', en: 'Power plant electrical works' },
    description: {
      th: 'งานระบบไฟฟ้าแรงดันสูงภายในโรงไฟฟ้า',
      en: 'High voltage electrical works inside a power plant.',
    },
  },
  {
    file: 'ceco-img/Sp6.webp',
    title: { th: 'งานระบบสายส่งไฟฟ้า', en: 'Transmission line works' },
    description: {
      th: 'งานติดตั้งและตรวจสอบระบบสายส่งไฟฟ้าแรงดันสูง',
      en: 'Installation and inspection of high voltage transmission lines.',
    },
  },
];

const JOBS: { position: Record<Locale, string>; amount: number; description: Record<Locale, string> }[] = [
  {
    position: { th: 'วิศวกรไฟฟ้า (Electrical Engineer)', en: 'Electrical Engineer' },
    amount: 2,
    description: {
      th: '<p>คุณสมบัติ</p><ul><li>ปริญญาตรี สาขาวิศวกรรมไฟฟ้า</li><li>มีใบอนุญาตประกอบวิชาชีพวิศวกรรม (กว.) จะพิจารณาเป็นพิเศษ</li><li>สามารถเดินทางไปปฏิบัติงานต่างจังหวัดได้</li></ul>',
      en: '<p>Requirements</p><ul><li>Bachelor degree in Electrical Engineering</li><li>A professional engineering licence is an advantage</li><li>Able to travel to site work</li></ul>',
    },
  },
  {
    position: { th: 'ช่างเทคนิคไฟฟ้า (Electrical Technician)', en: 'Electrical Technician' },
    amount: 3,
    description: {
      th: '<p>คุณสมบัติ</p><ul><li>ปวส. สาขาไฟฟ้ากำลัง หรือสาขาที่เกี่ยวข้อง</li><li>มีประสบการณ์งานระบบไฟฟ้าแรงดันสูงจะพิจารณาเป็นพิเศษ</li><li>สามารถทำงานเป็นทีมได้</li></ul>',
      en: '<p>Requirements</p><ul><li>Vocational diploma in Electrical Power or a related field</li><li>Experience with high voltage systems is an advantage</li><li>Able to work as part of a team</li></ul>',
    },
  },
  {
    position: { th: 'เจ้าหน้าที่ธุรการโครงการ', en: 'Project Administrator' },
    amount: 1,
    description: {
      th: '<p>คุณสมบัติ</p><ul><li>ปริญญาตรี ทุกสาขา</li><li>ใช้งาน Microsoft Office ได้ดี</li><li>มีความละเอียดรอบคอบในการจัดทำเอกสาร</li></ul>',
      en: '<p>Requirements</p><ul><li>Bachelor degree in any field</li><li>Good working knowledge of Microsoft Office</li><li>Careful and accurate with documentation</li></ul>',
    },
  },
];

const LOCALES: Locale[] = ['th', 'en'];

const HEADER_NAME: Record<Locale, string> = { th: 'หน้าแรก', en: 'Home' };

async function uploadAsset(relativePath: string, altText: Record<Locale, string>): Promise<Media> {
  const absolute = path.join(ASSETS, relativePath);
  const buffer = await fs.readFile(absolute);
  const ext = path.extname(absolute).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) throw new Error(`no known MIME type for ${relativePath}`);

  return mediaService.upload(
    {
      originalName: path.basename(absolute),
      buffer,
      mime,
      size: buffer.length,
    },
    { alternativeText: altText.en, name: path.basename(absolute, ext) },
  );
}

async function alreadySeeded(): Promise<boolean> {
  const { rows } = await db.query('SELECT COUNT(*) AS count FROM headers');
  return Number(rows[0]?.count ?? 0) > 0;
}

// Only the content tables, and only in an order the foreign keys allow. The admin account and the
// audit log are left alone.
async function wipeContent(): Promise<void> {
  const tables = [
    'header_slides',
    'headers',
    'recent_projects',
    'experience_works',
    'experience_companies',
    'experiences',
    'recruitments',
    'site_documents',
  ];
  for (const table of tables) {
    await db.query(`DELETE FROM ${table}`);
  }

  // Every file row is removed from storage as well, so a re-seed does not leave the old objects behind
  const { rows } = await db.query('SELECT id FROM media');
  for (const row of rows) {
    await mediaService.deleteMedia(Number(row.id), true);
  }
  console.log(`[seed:content] Cleared existing content and ${rows.length} file(s).`);
}

async function seedHeaders(images: Media[]): Promise<void> {
  for (const locale of LOCALES) {
    const header = await headerService.createHeader({ name: HEADER_NAME[locale], locale });

    for (const [index, slide] of HERO_SLIDES.entries()) {
      const image = images[index];
      await headerService.addSlide(header.id, {
        title: slide.title[locale],
        description: slide.description[locale],
        imageId: image ? image.id : null,
        position: index,
        isPublished: true,
      });
    }
    console.log(`[seed:content] Header "${locale}" with ${HERO_SLIDES.length} slides.`);
  }
}

async function seedRecentProjects(images: Media[]): Promise<void> {
  for (const locale of LOCALES) {
    for (const [index, project] of RECENT_PROJECTS.entries()) {
      const image = images[index];
      await recentProjectService.createProject({
        name: project.title[locale],
        description: project.description[locale],
        locale,
        imageId: image ? image.id : null,
        position: index,
        isPublished: true,
      });
    }
    console.log(`[seed:content] ${RECENT_PROJECTS.length} recent projects for "${locale}".`);
  }
}

// One example company with one example row per service page, so the table shows its shape without
// claiming a client the company may not have worked with
async function seedExperiences(): Promise<void> {
  for (const locale of LOCALES) {
    for (const [index, type] of EXPERIENCE_TYPES.entries()) {
      const experience = await experienceService.createExperience({ type, locale, position: index });
      const company = await experienceService.addCompany(experience.id, {
        name: EXAMPLE_LABEL[locale],
        position: 0,
      });
      await experienceService.addWork(company.id, {
        description:
          locale === 'th'
            ? 'เพิ่มรายการผลงานจริงได้ที่หน้าผู้ดูแลระบบ /admin/previous-work'
            : 'Add the real work items from the admin page at /admin/previous-work',
        year: new Date().getFullYear(),
        position: 0,
      });
    }
    console.log(`[seed:content] ${EXPERIENCE_TYPES.length} previous-work tables for "${locale}".`);
  }
}

async function seedRecruitments(): Promise<void> {
  for (const locale of LOCALES) {
    for (const [index, job] of JOBS.entries()) {
      await recruitmentService.createJob({
        position: job.position[locale],
        description: job.description[locale],
        amount: job.amount,
        priority: index,
        locale,
        isPublished: true,
      });
    }
    console.log(`[seed:content] ${JOBS.length} job openings for "${locale}".`);
  }
}

async function seedDocuments(logo: Media): Promise<void> {
  await documentService.createDocument({
    kind: 'logo',
    name: 'Site logo',
    description: 'Shown in the navbar',
    locale: null,
    fileId: logo.id,
    position: 0,
    isPublished: true,
  });

  // The company profile PDF was only ever in the old CMS. The row is created so the footer has
  // something to point at; the frontend hides the download button until a file is attached.
  await documentService.createDocument({
    kind: 'pdf',
    name: 'Profile',
    description: 'Company profile PDF — upload the file in /admin/documents',
    locale: null,
    fileId: null,
    position: 0,
    isPublished: true,
  });
  console.log('[seed:content] Logo attached; company profile row created without a file.');
}

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset');

  if (await alreadySeeded()) {
    if (!reset) {
      console.log('[seed:content] Content already exists. Re-run with --reset to replace it.');
      return;
    }
    await wipeContent();
  }

  console.log(`[seed:content] Reading assets from ${ASSETS}`);

  const heroImages = await Promise.all(HERO_SLIDES.map((slide) => uploadAsset(slide.file, slide.title)));
  const projectImages = await Promise.all(
    RECENT_PROJECTS.map((project) => uploadAsset(project.file, project.title)),
  );
  const logo = await uploadAsset('output/CECO-LOGO.webp', { th: 'โลโก้ CECO', en: 'CECO logo' });

  await seedHeaders(heroImages);
  await seedRecentProjects(projectImages);
  await seedExperiences();
  await seedRecruitments();
  await seedDocuments(logo);

  // Confirms the carousel the home page will actually receive
  const headers = new HeaderRepository();
  const published = await headers.findByLocale('th', false);
  console.log(
    `[seed:content] Done. The Thai home carousel has ${published?.slides.length ?? 0} published slide(s).`,
  );
}

main()
  .catch((err: Error) => {
    console.error(`[seed:content] ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
