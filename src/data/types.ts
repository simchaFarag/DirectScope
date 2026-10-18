export type Role = 'client' | 'contractor' | 'architect' | 'renovator';
export type Permission = 'view' | 'edit';
export type MemberRole = 'professional' | 'family' | 'renovator';
export type ProjectType = 'renovation' | 'addition' | 'newHome' | 'other';
export type StageIcon = 'general' | 'demolition' | 'plumbing' | 'electric' | 'ceramic' | 'extras';

export interface User {
  firstName: string;
  lastName: string;
  phone: string;
  gender: 'male' | 'female';
  role: Role;
  avatar?: string;
}

export interface Project {
  name: string;
  type: ProjectType;
  description: string;
  address: string;
  estimatedBudget?: number;
  startDate: string;
  endDate: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  role: MemberRole;
  permission: Permission;
  avatar?: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  phone: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'done' | 'inProgress' | 'todo';
  /** documentation added when the task was completed */
  note?: string;
  photo?: string;
}

export interface Stage {
  id: string;
  order: number;
  name: string;
  icon: StageIcon;
  budget: number;
  contractAmount: number;
  paid: number;
  duration: string;
  startDate: string;
  endDate: string;
  tasks: Task[];
  memberAvatars: string[];
}

export type ExpenseKind = 'architect' | 'designer' | 'surveyor' | 'fee' | 'other';

export interface ExtraExpense {
  id: string;
  kind: ExpenseKind;
  title: string;
  amount: number;
  tasks?: number;
  duration?: string;
}

export interface Receipt {
  id: string;
  stageId: string;
  title: string;
  amount: number;
  date: string;
  preview?: string;
}

export interface ShoppingItem {
  id: string;
  stageId: string;
  title: string;
  done: boolean;
  photo?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  mine?: boolean;
}

export interface Update {
  id: string;
  stageId: string;
  author: string;
  authorTitle: string;
  avatar?: string;
  time: string;
  text: string;
  photo?: string;
  photos?: string[];
  date?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  comments: Comment[];
}

export interface ExceptionReq {
  id: string;
  stageId: string;
  author: string;
  authorTitle: string;
  avatar?: string;
  time: string;
  title: string;
  description: string;
  amount: number;
  photos?: string[];
  rejectReason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Reminder {
  id: string;
  stageId: string;
  text: string;
  color: 'yellow' | 'blue';
}

export interface DocItem {
  id: string;
  stageId: string;
  title: string;
  date: string;
  fileName?: string;
  preview?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  image?: string;
}

export interface Inspiration {
  id: string;
  title: string;
  image?: string;
}
