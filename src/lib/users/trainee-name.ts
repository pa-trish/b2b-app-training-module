type NameFields = {
  firstName?: string | null;
  lastName?: string | null;
  name: string;
};

export function formatUserName(user: NameFields) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.name;
}

export function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function parseLegacyName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
