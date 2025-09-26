import { Template, ITemplate } from '../models/Template';

export class TemplateRepository {
  async findAll() {
    return Template.find({})
      .select('id title description category thumbnail estimatedTime pages')
      .sort({ category: 1, title: 1 });
  }

  async findByPublicId(id: string) {
    return Template.findOne({ id });
  }

  async upsertMany(samples: Partial<ITemplate>[]) {
    const ops = samples.map((tpl) => ({
      updateOne: {
        filter: { id: tpl.id },
        update: { $setOnInsert: tpl },
        upsert: true,
      },
    }));
    if (ops.length === 0) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 } as any;
    return Template.bulkWrite(ops);
  }

  async findManyByIds(ids: string[]) {
    return Template.find({ id: { $in: ids } }).select('id title category');
  }
}


