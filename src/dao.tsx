import { createClient, type Asset, type ChainModifiers } from "contentful";
import { getEnvVariable } from "./helper";
import { assert } from "console";

const contentful = createClient({
  accessToken: getEnvVariable("CONTENTFUL_ACCESS_TOKEN"),
  space: getEnvVariable("CONTENTFUL_SPACE_ID"),
});

export async function getHomeImages(): Promise<THomeImages> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: ["fields.sliderImages", "fields.missionImages", "fields.visionImages"],
    limit: 1,
  });

  const data = entries.items[0].fields;

  const sliderImgUrls = (data.sliderImages as Asset[]).map(asset => (`https:` + asset.fields.file?.url) as string);
  const missionImgUrls = (data.missionImages as Asset[]).map(asset => (`https:` + asset.fields.file?.url) as string);
  const visionImgUrls = (data.visionImages as Asset[]).map(asset => (`https:` + asset.fields.file?.url) as string);

  return { sliderImgUrls, missionImgUrls, visionImgUrls };
}

export async function getRules(): Promise<TRules> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: ["fields.volunteerRules", "fields.certificateCriteria"],
    limit: 1,
  });

  const data = entries.items[0].fields;

  return { volunteerRules: data.volunteerRules as string[], certificateCriteria: data.certificateCriteria as string[] };
}

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

export const teamBeliefs = [
  `At Selfless Sewa, our mantra of "Lead by Example" is our guiding light. It’s about walking the talk and setting the bar high ineverything we do. We don't just preach; we practice what we believe in—excellence, service, and dedication.`,
  `By leading with integrity and passion, we inspire others to follow suit and join us in our mission of service and empowerment. Our actions speak volumes, showing that making a difference is not just a slogan but a way of life.`,
];
