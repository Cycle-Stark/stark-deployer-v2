import Dexie, { Table } from 'dexie';

export interface INote {
  id?: number;
  title: string;
  note: string;
  createdAt: string;
}

class NotesDB extends Dexie {
  notes!: Table<INote>;

  constructor() {
    super('NotesDB');
    this.version(1).stores({
      notes: '++id, title, note, createdAt'
    });
  }
}

const db = new NotesDB();

export class NotesManager {
  private static instance: NotesManager;

  private constructor() {}

  static getInstance(): NotesManager {
    if (!NotesManager.instance) {
      NotesManager.instance = new NotesManager();
    }
    return NotesManager.instance;
  }

  async create(note: Omit<INote, 'id'>): Promise<number> {
    try {
      const id = await db.notes.add({
        ...note,
        createdAt: note.createdAt || new Date().toISOString(),
      });
      return id as number;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }

  async getAll(): Promise<INote[]> {
    try {
      return await db.notes.orderBy('id').reverse().toArray();
    } catch (error) {
      console.error('Failed to get all notes:', error);
      return [];
    }
  }

  async search(query: string): Promise<INote[]> {
    try {
      return await db.notes.filter(note =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.note.toLowerCase().includes(query.toLowerCase())
      ).reverse().toArray();
    } catch (error) {
      console.error('Failed to search notes:', error);
      return [];
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await db.notes.delete(id);
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await db.notes.count();
    } catch (error) {
      console.error('Failed to get notes count:', error);
      return 0;
    }
  }
}

export const notesDb = db;
export const notesManager = NotesManager.getInstance();
