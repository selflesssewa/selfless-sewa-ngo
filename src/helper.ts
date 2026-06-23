export function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (value == undefined) throw `ENV Variable "${name}" is not defined.`;
  return value;
}
