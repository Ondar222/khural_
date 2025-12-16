import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import fs from "fs";
import path from "path";

import { NewsEntity } from "../news/entities/news.entity";
import { PersonEntity } from "../persons/entities/person.entity";
import { DocumentEntity } from "../documents/entities/document.entity";
import { EventEntity } from "../events/entities/event.entity";

function safeReadJsonArray(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function docsTypeFromCategory(cat?: string): string {
  const c = String(cat || "").toLowerCase();
  if (c.includes("законопроект")) return "bills";
  if (c.includes("постанов")) return "resolutions";
  if (c.includes("инициатив")) {
    if (c.includes("граждан")) return "civic";
    return "initiatives";
  }
  if (c.includes("конститу")) return "constitution";
  if (c.includes("закон")) return "laws";
  return "other";
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(PersonEntity)
    private readonly personsRepo: Repository<PersonEntity>,
    @InjectRepository(DocumentEntity)
    private readonly docsRepo: Repository<DocumentEntity>,
    @InjectRepository(EventEntity)
    private readonly eventsRepo: Repository<EventEntity>,
  ) {}

  async onModuleInit() {
    const enabled = process.env.SEED_FROM_FRONT !== "false";
    if (!enabled) return;
    const force = process.env.SEED_FORCE === "true";

    // Only seed if tables are empty
    const [newsCount, personsCount, docsCount, eventsCount] = await Promise.all([
      this.newsRepo.count(),
      this.personsRepo.count(),
      this.docsRepo.count(),
      this.eventsRepo.count(),
    ]);

    const shouldSeed =
      force ||
      newsCount === 0 ||
      personsCount === 0 ||
      docsCount === 0 ||
      eventsCount === 0;
    if (!shouldSeed) return;

    const dataDirCandidates = [
      path.resolve(process.cwd(), "..", "khural-front", "public", "data"),
      path.resolve(process.cwd(), "khural-front", "public", "data"),
      path.resolve(process.cwd(), "public", "data"),
    ];

    const dataDir = dataDirCandidates.find((p) => fs.existsSync(p));
    if (!dataDir) {
      this.logger.warn("Seed skipped: cannot find khural-front/public/data");
      return;
    }

    this.logger.log(`Seeding from: ${dataDir}`);

    await this.seedNews(path.join(dataDir, "news.json"));
    await this.seedPersons(path.join(dataDir, "deputies.json"));
    await this.seedDocuments(dataDir);
    await this.seedEvents(path.join(dataDir, "events.json"));

    this.logger.log("Seed completed");
  }

  private async seedNews(newsJsonPath: string) {
    const rows = safeReadJsonArray(newsJsonPath);
    if (!rows.length) return;

    for (const n of rows) {
      const externalId = n?.id ? String(n.id) : undefined;
      if (!externalId) continue;

      const exists = await this.newsRepo.findOne({ where: { externalId } });
      if (exists) continue;

      const entity = this.newsRepo.create({
        externalId,
        category: n.category || "Новости",
        publishedAt: n.date || undefined,
        content: [
          {
            lang: "ru",
            title: n.title || "",
            description: n.excerpt || "",
          } as any,
        ],
      });
      await this.newsRepo.save(entity);
    }
  }

  private async seedPersons(deputiesJsonPath: string) {
    const rows = safeReadJsonArray(deputiesJsonPath);
    if (!rows.length) return;

    for (const d of rows) {
      const externalId = d?.id ? String(d.id) : undefined;
      if (!externalId) continue;

      const exists = await this.personsRepo.findOne({ where: { externalId } });
      if (exists) continue;

      const entity = this.personsRepo.create({
        externalId,
        fullName: d.name || "",
        electoralDistrict: d.district || "",
        district: d.district || "",
        convocation: d.convocation || "",
        faction: d.faction || "",
        description: d.position || "",
        email: d?.contacts?.email || "",
        phoneNumber: d?.contacts?.phone || "",
        receptionSchedule: d.reception || "",
        photoUrl: d.photo || "",
      } as any);
      await this.personsRepo.save(entity);
    }
  }

  private async seedDocuments(dataDir: string) {
    const docsFiles = [
      { file: "documents.json", type: null },
      { file: "docs_laws.json", type: "laws" },
      { file: "docs_resolutions.json", type: "resolutions" },
      { file: "docs_initiatives.json", type: "initiatives" },
      { file: "docs_civic.json", type: "civic" },
      { file: "docs_constitution.json", type: "constitution" },
      { file: "docs_bills.json", type: "bills" },
    ];

    for (const f of docsFiles) {
      const rows = safeReadJsonArray(path.join(dataDir, f.file));
      if (!rows.length) continue;

      for (const row of rows) {
        const externalId = row?.id ? String(row.id) : undefined;
        if (!externalId) continue;

        const exists = await this.docsRepo.findOne({ where: { externalId } });
        if (exists) continue;

        const category = row.category || undefined;
        const type = f.type || docsTypeFromCategory(category);

        const entity = this.docsRepo.create({
          externalId,
          title: row.title || "",
          description: row.desc || row.description || "",
          number: row.number || "",
          date: row.date || "",
          category: category || "",
          type,
          url: row.url || "",
        });
        await this.docsRepo.save(entity);
      }
    }
  }

  private async seedEvents(eventsJsonPath: string) {
    const rows = safeReadJsonArray(eventsJsonPath);
    if (!rows.length) return;

    for (const e of rows) {
      const externalId = e?.id ? String(e.id) : undefined;
      if (!externalId) continue;

      const exists = await this.eventsRepo.findOne({ where: { externalId } });
      if (exists) continue;

      const entity = this.eventsRepo.create({
        externalId,
        date: e.date,
        title: e.title || "",
        time: e.time || "",
        place: e.place || "",
        desc: e.desc || "",
      });
      await this.eventsRepo.save(entity);
    }
  }
}



