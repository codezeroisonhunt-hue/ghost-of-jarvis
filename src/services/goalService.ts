
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  progress: number;
  status: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  habit_name: string;
  streak_count: number;
  last_logged?: string;
  created_at: string;
}

const GOALS_STORAGE_KEY = 'jarvis_goals';
const HABITS_STORAGE_KEY = 'jarvis_habits';

const getStoredGoals = (): Goal[] => {
  try {
    const stored = localStorage.getItem(GOALS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveGoals = (goals: Goal[]) => {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
};

const getStoredHabits = (): Habit[] => {
  try {
    const stored = localStorage.getItem(HABITS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveHabits = (habits: Habit[]) => {
  localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
};

export const goalService = {
  // Goal methods
  async createGoal(goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>): Promise<Goal | null> {
    try {
      const newGoal: Goal = {
        ...goal,
        id: Date.now().toString(),
        user_id: 'local',
        created_at: new Date().toISOString()
      };
      
      const goals = getStoredGoals();
      goals.push(newGoal);
      saveGoals(goals);
      return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      return null;
    }
  },

  async getGoals(): Promise<Goal[]> {
    try {
      return getStoredGoals().sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  },

  async updateGoalProgress(id: string, progress: number): Promise<Goal | null> {
    try {
      const goals = getStoredGoals();
      const index = goals.findIndex(g => g.id === id);
      
      if (index === -1) return null;
      
      goals[index].progress = progress;
      saveGoals(goals);
      return goals[index];
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return null;
    }
  },

  // Habit methods
  async createHabit(habitName: string): Promise<Habit | null> {
    try {
      const newHabit: Habit = {
        id: Date.now().toString(),
        user_id: 'local',
        habit_name: habitName,
        streak_count: 0,
        created_at: new Date().toISOString()
      };
      
      const habits = getStoredHabits();
      habits.push(newHabit);
      saveHabits(habits);
      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      return null;
    }
  },

  async getHabits(): Promise<Habit[]> {
    try {
      return getStoredHabits().sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  },

  async logHabit(id: string): Promise<Habit | null> {
    try {
      const habits = getStoredHabits();
      const index = habits.findIndex(h => h.id === id);
      
      if (index === -1) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const currentHabit = habits[index];
      
      let newStreakCount = 1;
      if (currentHabit.last_logged) {
        const lastLogged = new Date(currentHabit.last_logged);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogged.toDateString() === yesterday.toDateString()) {
          newStreakCount = currentHabit.streak_count + 1;
        }
      }
      
      habits[index] = {
        ...currentHabit,
        last_logged: today,
        streak_count: newStreakCount
      };
      
      saveHabits(habits);
      return habits[index];
    } catch (error) {
      console.error('Error logging habit:', error);
      return null;
    }
  }
};
