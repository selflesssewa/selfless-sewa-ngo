import { createClient, type Asset, type Entry } from "contentful";
import { getEnvVariable } from "./helper";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Block, Document, Text, TopLevelBlock } from "@contentful/rich-text-types";
import { notDeepEqual } from "assert";
import test from "node:test";
import { block } from "sharp";

const contentful = createClient({
  accessToken: getEnvVariable("CONTENTFUL_ACCESS_TOKEN"),
  space: getEnvVariable("CONTENTFUL_SPACE_ID"),
});

export async function getLayoutContent(): Promise<TLayoutContent> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: [
      "fields.contactNo",
      "fields.contactEmailId",
      "fields.collabEmailId",
      "fields.socials",
      "fields.volunteerFormLink",
      "fields.donationFormLink",
    ],
    limit: 1,
  });

  const data = entries.items[0].fields;

  const socials = (data.socials as Entry[]).map(entry => {
    return { handle: entry.fields.handle, url: entry.fields.url } as TSocial;
  });

  return {
    donationFormLink: data.donationFormLink as string,
    volunteerFormLink: data.volunteerFormLink as string,
    contactNo: data.contactNo as string,
    contactEmailId: data.contactEmailId as string,
    collabEmailId: data.collabEmailId as string,
    socials,
  };
}

type TLoc = {
  lat: number;
  lon: number;
};

export async function getHomePageContent(): Promise<THomePageContent> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: [
      "fields.sliderImages",
      "fields.missionImages",
      "fields.visionImages",
      "fields.locations",
      "fields.donationFormLink",
      "fields.testimonials",
    ],
    limit: 1,
  });

  const data = entries.items[0].fields;

  const locations = (data.locations as Entry[]).map(({ fields }) => {
    return {
      label: fields.label,
      lon: (fields.coord as TLoc).lon,
      lat: (fields.coord as TLoc).lat,
      offsetX: fields.offsetX,
      offsetY: fields.offsetY,
    } as TLocation;
  });

  const parseText = (doc: Document) =>
    documentToReactComponents(doc, {
      renderNode: {
        [BLOCKS.PARAGRAPH]: (node, children) => {
          const length = node.content.reduce((length, block) => (length += (block as Text).value.length), 0);
          return (
            <p data-length={length} className="text-balance">
              {children}
            </p>
          );
        },
      },
      renderText: text => {
        return text.split("\n").reduce((children, textSegment, index) => {
          return [...children, index > 0 && <br key={index} />, textSegment] as string[];
        }, [] as string[]);
      },
    });

  const testimonials = (data.testimonials as Entry[]).map(({ fields }) => {
    return {
      name: fields.name,
      role: fields.role,
      content: parseText(fields.content as Document),
    } as TTestimonial;
  });

  const sliderImgUrls = (data.sliderImages as Asset[]).map(asset => (`https:` + asset.fields.file?.url) as string);
  const missionImgUrls = (data.missionImages as Asset[]).map(asset => (`https:` + asset.fields.file?.url) as string);
  const visionImgUrls = (data.visionImages as Asset[]).map(asset => (`https:` + asset.fields.file?.url) as string);

  return {
    locations,
    testimonials,
    sliderImgUrls,
    missionImgUrls,
    visionImgUrls,
    donationFormLink: data.donationFormLink as string,
  };
}

export async function getVolunteerPageContent(): Promise<TVolunteerPageContent> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: ["fields.volunteerRules", "fields.certificateCriteria", "fields.volunteerFormLink"],
    limit: 1,
  });

  const data = entries.items[0].fields;

  return {
    volunteerRules: data.volunteerRules as string[],
    certificateCriteria: data.certificateCriteria as string[],
    volunteerFormLink: data.volunteerFormLink as string,
  };
}

export async function getTeamPageContent(): Promise<TTeamPageContent> {
  const entries = await contentful.getEntries({
    content_type: "sewak",
    order: ["fields.department", "fields.name"],
    select: ["fields"],
  });

  const team: TSewak[] = [];
  let founder: TSewakWithBio | undefined;

  entries.items.forEach(el => {
    const member: TSewak = {
      name: el.fields.name as string,
      role: el.fields.department as string,
      imgUrl: `https:` + (el.fields.profileImage as Asset).fields.file?.url,
    };

    const parseBio = (doc: Document) =>
      documentToReactComponents(doc, {
        renderNode: {
          [BLOCKS.PARAGRAPH]: (_, children) => <p>{children}</p>,
        },
        renderText: text => {
          return text.split("\n").reduce((children, textSegment, index) => {
            return [...children, index > 0 && <br key={index} />, textSegment] as string[];
          }, [] as string[]);
        },
      });

    if (member.role === "Founder Trustee") {
      founder = { ...member, bio: parseBio(el.fields.bio as Document) };
    } else {
      team.push(member);
    }
  });

  const linkEntries = await contentful.getEntries({
    content_type: "misc",
    select: ["fields.volunteerFormLink"],
    limit: 1,
  });

  const data = linkEntries.items[0].fields;

  return {
    team,
    founder: founder as TSewakWithBio,
    volunteerFormLink: data.volunteerFormLink as string,
  };
}

export const teamBeliefs = [
  `At Selfless Sewa, our mantra of "Lead by Example" is our guiding light. It’s about walking the talk and setting the bar high ineverything we do. We don't just preach; we practice what we believe in—excellence, service, and dedication.`,
  `By leading with integrity and passion, we inspire others to follow suit and join us in our mission of service and empowerment. Our actions speak volumes, showing that making a difference is not just a slogan but a way of life.`,
];
