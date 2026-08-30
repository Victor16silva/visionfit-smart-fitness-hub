type GoalInput = {
  gender?: string | null;
  age?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  training_level?: string | null;
};

export function estimateDailyMacros(goals: GoalInput | null) {
  const weight = Number(goals?.weight_kg) || 70;
  const height = Number(goals?.height_cm) || 170;
  const age = Number(goals?.age) || 30;
  const gender = (goals?.gender || "").toLowerCase();
  const isMale = gender === "male" || gender === "masculino" || gender === "homem";

  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const level = (goals?.training_level || "").toLowerCase();
  const activity =
    level.includes("avan") ? 1.725 :
    level.includes("inter") ? 1.55 :
    1.375;

  const calories = Math.round(bmr * activity);
  const protein = Math.round(weight * 1.8);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}
