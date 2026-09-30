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
import { SlideSeed } from '../types/seed.types';

// The old CMS is gone, so the site's own assets and translation files are the source. Anything that
// existed only in the old database is seeded as a clearly-labelled example for the editor to replace.
const ASSETS = path.resolve(process.cwd(), '..', 'frontend', 'assets', 'images');
const DOCUMENTS = path.resolve(process.cwd(), '..', 'frontend', 'assets', 'documents');

// Optional: a PDF sitting here is attached to the company profile row. Without it the row is still
// created, empty, for the editor to fill in from /admin/documents.
const PROFILE_PDF = 'company-profile.pdf';

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

const JOBS: {
  position: Record<Locale, string>;
  amount: number;
  description: Record<Locale, string>;
}[] = [
  {
    position: {
      th: 'วิศวกรไฟฟ้า (Electrical Engineer)',
      en: 'Electrical Engineer',
    },
    amount: 2,
    description: {
      th: `
        <p><strong>หน้าที่ความรับผิดชอบ</strong></p>
        <ul>
          <li>ออกแบบ ตรวจสอบ และควบคุมงานระบบไฟฟ้าของโครงการให้เป็นไปตามแบบ มาตรฐานทางวิศวกรรม และข้อกำหนดของโครงการ</li>
          <li>วางแผนและควบคุมการติดตั้งระบบไฟฟ้า รวมถึงระบบไฟฟ้ากำลัง ระบบควบคุม และอุปกรณ์ไฟฟ้าที่เกี่ยวข้อง</li>
          <li>ตรวจสอบแบบก่อสร้าง (Shop Drawing) วัสดุ และวิธีการติดตั้งให้ถูกต้องตามหลักวิศวกรรม</li>
          <li>ประสานงานกับผู้รับเหมา ทีมวิศวกร ผู้ควบคุมงาน และหน่วยงานที่เกี่ยวข้องเพื่อแก้ไขปัญหาหน้างาน</li>
          <li>ตรวจสอบคุณภาพงานและติดตามความคืบหน้าให้เป็นไปตามแผนงานและระยะเวลาที่กำหนด</li>
          <li>จัดทำและตรวจสอบเอกสารทางวิศวกรรม เช่น รายงานความคืบหน้า รายงานการตรวจสอบ และเอกสารส่งมอบงาน</li>
          <li>วิเคราะห์ปัญหาระบบไฟฟ้าและเสนอแนวทางแก้ไขที่เหมาะสมและปลอดภัย</li>
          <li>ควบคุมการปฏิบัติงานให้เป็นไปตามมาตรฐานด้านความปลอดภัยและข้อกำหนดของโครงการ</li>
          <li>สามารถเดินทางไปปฏิบัติงานตามพื้นที่โครงการหรือต่างจังหวัดได้</li>
        </ul>

        <p><strong>คุณสมบัติ</strong></p>
        <ul>
          <li>ปริญญาตรี สาขาวิศวกรรมไฟฟ้า หรือสาขาที่เกี่ยวข้อง</li>
          <li>มีใบอนุญาตประกอบวิชาชีพวิศวกรรมควบคุม (กว.) จะพิจารณาเป็นพิเศษ</li>
          <li>มีประสบการณ์ด้านงานระบบไฟฟ้า งานก่อสร้าง หรืองานโครงการ จะได้รับการพิจารณาเป็นพิเศษ</li>
          <li>มีความรู้เกี่ยวกับระบบไฟฟ้ากำลัง ระบบไฟฟ้าอาคาร และมาตรฐานทางวิศวกรรมที่เกี่ยวข้อง</li>
          <li>สามารถอ่านและทำความเข้าใจแบบทางวิศวกรรมและแบบไฟฟ้าได้</li>
          <li>มีทักษะในการวิเคราะห์และแก้ไขปัญหาหน้างาน</li>
          <li>สามารถใช้ Microsoft Office ได้ดี และหากสามารถใช้ AutoCAD หรือโปรแกรมทางวิศวกรรมอื่น ๆ ได้จะพิจารณาเป็นพิเศษ</li>
          <li>มีความรับผิดชอบสูง สามารถทำงานภายใต้แรงกดดันและบริหารงานให้เป็นไปตามกำหนดเวลาได้</li>
          <li>สามารถทำงานเป็นทีมและประสานงานกับหลายฝ่ายได้เป็นอย่างดี</li>
          <li>สามารถเดินทางไปปฏิบัติงานต่างจังหวัดได้</li>
        </ul>
      `,
      en: `
        <p><strong>Responsibilities</strong></p>
        <ul>
          <li>Design, review, and supervise electrical system work in accordance with engineering standards, project specifications, and approved drawings.</li>
          <li>Plan and control the installation of electrical systems, including power systems, control systems, and related electrical equipment.</li>
          <li>Review construction drawings, shop drawings, materials, and installation methods to ensure compliance with engineering requirements.</li>
          <li>Coordinate with contractors, engineers, supervisors, and relevant departments to resolve technical and site-related issues.</li>
          <li>Inspect work quality and monitor project progress to ensure compliance with project schedules and requirements.</li>
          <li>Prepare and review engineering documents, including progress reports, inspection reports, and project handover documents.</li>
          <li>Analyze electrical system problems and propose appropriate and safe solutions.</li>
          <li>Ensure that electrical work complies with applicable safety standards and project requirements.</li>
          <li>Travel to project sites and work in other provinces as required.</li>
        </ul>

        <p><strong>Requirements</strong></p>
        <ul>
          <li>Bachelor's degree in Electrical Engineering or a related field.</li>
          <li>A Professional Engineering License (กว.) is an advantage.</li>
          <li>Experience in electrical systems, construction, or engineering projects is an advantage.</li>
          <li>Good knowledge of electrical power systems, building electrical systems, and relevant engineering standards.</li>
          <li>Ability to read and understand electrical and engineering drawings.</li>
          <li>Strong analytical and problem-solving skills.</li>
          <li>Good working knowledge of Microsoft Office. Experience with AutoCAD or other engineering software is an advantage.</li>
          <li>Strong sense of responsibility and ability to work under pressure and meet deadlines.</li>
          <li>Good communication, coordination, and teamwork skills.</li>
          <li>Willing and able to travel to project sites in other provinces.</li>
        </ul>
      `,
    },
  },

  {
    position: {
      th: 'ช่างเทคนิคไฟฟ้า (Electrical Technician)',
      en: 'Electrical Technician',
    },
    amount: 3,
    description: {
      th: `
        <p><strong>หน้าที่ความรับผิดชอบ</strong></p>
        <ul>
          <li>ติดตั้ง ตรวจสอบ บำรุงรักษา และซ่อมแซมระบบไฟฟ้าและอุปกรณ์ไฟฟ้าภายในโครงการ</li>
          <li>ปฏิบัติงานเกี่ยวกับระบบไฟฟ้ากำลัง ตู้ควบคุม สายไฟ อุปกรณ์ป้องกัน และอุปกรณ์ไฟฟ้าที่เกี่ยวข้อง</li>
          <li>ตรวจสอบสภาพอุปกรณ์และระบบไฟฟ้าให้อยู่ในสภาพพร้อมใช้งานและปลอดภัย</li>
          <li>แก้ไขปัญหาเบื้องต้นของระบบไฟฟ้าเมื่อเกิดความผิดปกติหรือขัดข้อง</li>
          <li>ช่วยเหลือทีมวิศวกรในการติดตั้ง ตรวจสอบ และทดสอบระบบไฟฟ้าตามแบบและข้อกำหนดของโครงการ</li>
          <li>บันทึกผลการตรวจสอบ การบำรุงรักษา และปัญหาที่พบในการปฏิบัติงาน</li>
          <li>ดูแลเครื่องมือและอุปกรณ์ที่ใช้ในการทำงานให้อยู่ในสภาพพร้อมใช้งาน</li>
          <li>ปฏิบัติงานตามขั้นตอนด้านความปลอดภัย โดยเฉพาะงานที่เกี่ยวข้องกับระบบไฟฟ้าแรงดันสูง</li>
          <li>ประสานงานกับทีมช่าง วิศวกร และผู้เกี่ยวข้องเพื่อให้งานแล้วเสร็จตามแผน</li>
          <li>สามารถเดินทางไปปฏิบัติงานตามพื้นที่โครงการหรือต่างจังหวัดได้</li>
        </ul>

        <p><strong>คุณสมบัติ</strong></p>
        <ul>
          <li>ปวส. สาขาไฟฟ้ากำลัง ไฟฟ้าอุตสาหกรรม หรือสาขาที่เกี่ยวข้อง</li>
          <li>มีประสบการณ์ด้านงานติดตั้งระบบไฟฟ้า งานซ่อมบำรุง หรือสายงานที่เกี่ยวข้องจะพิจารณาเป็นพิเศษ</li>
          <li>มีประสบการณ์เกี่ยวกับระบบไฟฟ้าแรงดันสูงจะพิจารณาเป็นพิเศษ</li>
          <li>มีความรู้พื้นฐานด้านระบบไฟฟ้า การอ่านวงจรไฟฟ้า และการใช้เครื่องมือวัดทางไฟฟ้า</li>
          <li>สามารถใช้เครื่องมือช่างและอุปกรณ์ตรวจวัดทางไฟฟ้าได้อย่างถูกต้องและปลอดภัย</li>
          <li>มีความรับผิดชอบ ขยัน อดทน และสามารถปฏิบัติงานตามเวลาที่กำหนดได้</li>
          <li>สามารถทำงานเป็นทีมและประสานงานกับเพื่อนร่วมงานได้ดี</li>
          <li>มีความตระหนักด้านความปลอดภัยและปฏิบัติตามกฎระเบียบอย่างเคร่งครัด</li>
          <li>หากมีใบรับรองหรือผ่านการอบรมด้านความปลอดภัยทางไฟฟ้าจะพิจารณาเป็นพิเศษ</li>
          <li>สามารถเดินทางไปปฏิบัติงานต่างจังหวัดได้</li>
        </ul>
      `,
      en: `
        <p><strong>Responsibilities</strong></p>
        <ul>
          <li>Install, inspect, maintain, and repair electrical systems and equipment at project sites.</li>
          <li>Work with electrical power systems, control panels, wiring, protection devices, and related electrical equipment.</li>
          <li>Inspect electrical equipment and systems to ensure they are in good working condition and meet safety requirements.</li>
          <li>Troubleshoot and perform basic repairs when electrical system faults or abnormalities occur.</li>
          <li>Support engineers with the installation, inspection, and testing of electrical systems according to approved drawings and project requirements.</li>
          <li>Record inspection results, maintenance activities, and problems identified during operations.</li>
          <li>Maintain tools, testing equipment, and other work equipment in good working condition.</li>
          <li>Follow electrical safety procedures, particularly when working with high-voltage systems.</li>
          <li>Coordinate with technicians, engineers, contractors, and other team members to complete work according to project schedules.</li>
          <li>Travel to project sites and work in other provinces as assigned.</li>
        </ul>

        <p><strong>Requirements</strong></p>
        <ul>
          <li>Vocational Diploma (ปวส.) in Electrical Power, Industrial Electrical Engineering, or a related field.</li>
          <li>Experience in electrical installation, maintenance, or related work is an advantage.</li>
          <li>Experience with high-voltage electrical systems is an advantage.</li>
          <li>Basic knowledge of electrical systems, circuit diagrams, and electrical measurement instruments.</li>
          <li>Ability to use electrical tools and testing equipment correctly and safely.</li>
          <li>Responsible, hardworking, reliable, and able to work according to assigned schedules.</li>
          <li>Ability to work effectively as part of a team.</li>
          <li>Strong awareness of workplace safety and ability to follow electrical safety procedures.</li>
          <li>Electrical safety training or relevant technical certifications are an advantage.</li>
          <li>Willing and able to travel to project sites in other provinces.</li>
        </ul>
      `,
    },
  },

  {
    position: {
      th: 'เจ้าหน้าที่ธุรการโครงการ',
      en: 'Project Administrator',
    },
    amount: 1,
    description: {
      th: `
        <p><strong>หน้าที่ความรับผิดชอบ</strong></p>
        <ul>
          <li>จัดทำ จัดเก็บ และดูแลเอกสารต่าง ๆ ที่เกี่ยวข้องกับโครงการให้เป็นระบบ</li>
          <li>จัดทำหนังสือ รายงาน แบบฟอร์ม และเอกสารสำหรับการประสานงานภายในและภายนอกองค์กร</li>
          <li>บันทึกข้อมูลและจัดทำรายงานความคืบหน้าของโครงการตามที่ได้รับมอบหมาย</li>
          <li>ดูแลระบบจัดเก็บเอกสารทั้งในรูปแบบเอกสารและไฟล์อิเล็กทรอนิกส์</li>
          <li>ประสานงานระหว่างทีมโครงการ ผู้รับเหมา ลูกค้า และหน่วยงานที่เกี่ยวข้อง</li>
          <li>จัดเตรียมเอกสารสำหรับการประชุม รวมถึงจัดทำรายงานการประชุมและติดตามงานที่เกี่ยวข้อง</li>
          <li>ตรวจสอบความครบถ้วนและความถูกต้องของเอกสารก่อนนำเสนอหรือส่งให้หน่วยงานที่เกี่ยวข้อง</li>
          <li>ดูแลตารางนัดหมาย การประชุม และงานธุรการทั่วไปของทีมโครงการ</li>
          <li>จัดทำและดูแลเอกสารค่าใช้จ่ายหรือเอกสารสนับสนุนโครงการตามที่ได้รับมอบหมาย</li>
          <li>สนับสนุนงานของผู้จัดการโครงการและทีมงานในด้านเอกสารและการประสานงาน</li>
          <li>ปฏิบัติงานอื่น ๆ ตามที่ได้รับมอบหมาย</li>
        </ul>

        <p><strong>คุณสมบัติ</strong></p>
        <ul>
          <li>ปริญญาตรี ทุกสาขา</li>
          <li>มีประสบการณ์ด้านงานธุรการ งานเอกสาร หรืองานประสานงานโครงการจะพิจารณาเป็นพิเศษ</li>
          <li>สามารถใช้งาน Microsoft Office เช่น Word, Excel และ PowerPoint ได้ดี</li>
          <li>หากสามารถใช้งาน Google Workspace หรือโปรแกรมจัดการเอกสารอื่น ๆ ได้จะพิจารณาเป็นพิเศษ</li>
          <li>มีทักษะในการจัดทำเอกสารและจัดเก็บข้อมูลอย่างเป็นระบบ</li>
          <li>มีความละเอียดรอบคอบและสามารถตรวจสอบข้อมูลและเอกสารได้ดี</li>
          <li>มีทักษะในการสื่อสารและประสานงานกับบุคคลหลายฝ่าย</li>
          <li>สามารถจัดลำดับความสำคัญและบริหารจัดการงานหลายอย่างพร้อมกันได้</li>
          <li>มีความรับผิดชอบ ตรงต่อเวลา และสามารถทำงานตามกำหนดเวลาของโครงการได้</li>
          <li>สามารถทำงานเป็นทีมและมีมนุษยสัมพันธ์ที่ดี</li>
          <li>หากสามารถเดินทางไปปฏิบัติงานตามพื้นที่โครงการหรือต่างจังหวัดได้จะพิจารณาเป็นพิเศษ</li>
        </ul>
      `,
      en: `
        <p><strong>Responsibilities</strong></p>
        <ul>
          <li>Prepare, organize, maintain, and manage project-related documents in a systematic manner.</li>
          <li>Prepare letters, reports, forms, correspondence, and other documents for internal and external communication.</li>
          <li>Record project information and prepare project progress reports as assigned.</li>
          <li>Maintain physical and electronic document filing systems to ensure documents are properly organized and easy to retrieve.</li>
          <li>Coordinate with project teams, contractors, clients, and relevant departments.</li>
          <li>Prepare documents and materials for meetings, take meeting minutes, and follow up on related action items.</li>
          <li>Review documents for completeness and accuracy before submission to relevant parties.</li>
          <li>Manage meeting schedules, appointments, and general administrative tasks for the project team.</li>
          <li>Prepare and maintain expense records and other project-support documentation as assigned.</li>
          <li>Provide administrative and documentation support to the Project Manager and project team.</li>
          <li>Perform other administrative and project-related duties as assigned.</li>
        </ul>

        <p><strong>Requirements</strong></p>
        <ul>
          <li>Bachelor's degree in any field.</li>
          <li>Experience in administration, document control, or project coordination is an advantage.</li>
          <li>Good working knowledge of Microsoft Office, particularly Word, Excel, and PowerPoint.</li>
          <li>Experience with Google Workspace or other document management tools is an advantage.</li>
          <li>Strong organizational skills and the ability to manage documents systematically.</li>
          <li>High attention to detail with good document and data verification skills.</li>
          <li>Good communication and coordination skills with the ability to work with multiple stakeholders.</li>
          <li>Ability to manage multiple tasks, prioritize responsibilities, and meet deadlines.</li>
          <li>Responsible, punctual, organized, and able to work effectively under project deadlines.</li>
          <li>Good interpersonal and teamwork skills.</li>
          <li>Willing and able to travel to project sites or work in other provinces is an advantage.</li>
        </ul>
      `,
    },
  },
];

const LOCALES: Locale[] = ['th', 'en'];

const HEADER_NAME: Record<Locale, string> = { th: 'หน้าแรก', en: 'Home' };

async function uploadAsset(
  relativePath: string,
  altText: Record<Locale, string>,
  base: string = ASSETS,
): Promise<Media> {
  const absolute = path.join(base, relativePath);
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

// A missing PDF is not a failure: the seed has to keep working on a checkout that does not carry
// one, so the company profile row is simply left empty in that case.
async function uploadProfile(): Promise<Media | null> {
  try {
    return await uploadAsset(
      PROFILE_PDF,
      { th: 'โปรไฟล์บริษัท CECO', en: 'CECO company profile' },
      DOCUMENTS,
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    console.log(`[seed:content] No ${PROFILE_PDF} in ${DOCUMENTS}; the profile row is left empty.`);
    return null;
  }
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

async function seedDocuments(logo: Media, profile: Media | null): Promise<void> {
  await documentService.createDocument({
    kind: 'logo',
    name: 'Site logo',
    description: 'Shown in the navbar',
    locale: null,
    fileId: logo.id,
    position: 0,
    isPublished: true,
  });

  // The row is created either way so the footer has something to point at; the frontend hides the
  // download button until a file is attached.
  await documentService.createDocument({
    kind: 'pdf',
    name: 'Profile',
    description: profile
      ? 'Company profile PDF — replace it in /admin/documents'
      : 'Company profile PDF — upload the file in /admin/documents',
    locale: null,
    fileId: profile ? profile.id : null,
    position: 0,
    isPublished: true,
  });
  console.log(
    profile
      ? `[seed:content] Logo attached; company profile attached from ${PROFILE_PDF}.`
      : '[seed:content] Logo attached; company profile row created without a file.',
  );
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
  const profile = await uploadProfile();

  await seedHeaders(heroImages);
  await seedRecentProjects(projectImages);
  await seedExperiences();
  await seedRecruitments();
  await seedDocuments(logo, profile);

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
