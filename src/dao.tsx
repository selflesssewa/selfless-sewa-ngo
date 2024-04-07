import { createClient, type Asset } from "contentful";
import { getEnvVariable } from "./helper";

const contentful = createClient({
  accessToken: getEnvVariable("CONTENTFUL_ACCESS_TOKEN"),
  space: getEnvVariable("CONTENTFUL_SPACE_ID"),
});

export async function getCoreTeam(): Promise<TTeamCardData> {
  const entries = await contentful.getEntries({
    content_type: "sewak",
    select: ["fields"],
    order: ["fields.department", "fields.name"],
  });

  const team: TSewak[] = [];
  let founder: TFounder | undefined;
  entries.items.forEach(el => {
    const member: TSewak = {
      name: el.fields.name as string,
      role: el.fields.department as string,
      imgUrl: `https:` + (el.fields.profileImage as Asset).fields.file?.url,
    };

    if (member.role === "Founder") {
      founder = { ...member, bio: el.fields.bio as string };
    } else {
      team.push(member);
    }
  });

  return { team, founder: founder as TFounder };
}
