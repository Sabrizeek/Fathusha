import { DEMO_STUDENT_ID } from "../config/demoStudent.js";
import Skill from "../models/Skill.js";

const defaultSkills = [
  "Communication",
  "Teamwork",
  "Problem Solving",
  "Time Management",
  "Programming",
  "Documentation",
  "Research",
  "Presentation"
];

export const seedDefaultSkills = async () => {
  const count = await Skill.countDocuments();

  if (count > 0) {
    return;
  }

  await Promise.all(
    defaultSkills.map((name) =>
      Skill.updateOne(
        { name },
        { $setOnInsert: { name, isDefault: true } },
        { upsert: true }
      )
    )
  );
};

export const getSkills = async (_req, res, next) => {
  try {
    await seedDefaultSkills();

    const skills = await Skill.find().collation({ locale: "en", strength: 2 }).sort({ name: 1 });
    res.json(skills);
  } catch (error) {
    next(error);
  }
};

export const createSkill = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({ message: "Skill name is required." });
    }

    const existing = await Skill.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    });

    if (existing) {
      return res.json(existing);
    }

    const skill = await Skill.create({
      name,
      createdBy: DEMO_STUDENT_ID,
      isDefault: false
    });

    res.status(201).json(skill);
  } catch (error) {
    if (error.code === 11000) {
      const name = req.body.name?.trim();
      const existing = await Skill.findOne({
        name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
      });

      if (existing) {
        return res.json(existing);
      }

      return res.status(409).json({ message: "Skill already exists." });
    }

    next(error);
  }
};
