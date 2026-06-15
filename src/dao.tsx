import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document, Text } from "@contentful/rich-text-types";
import { createClient, type Asset, type Entry } from "contentful";
import { cache } from "react";
import { SymbolCodepoints } from "react-material-symbols";
import { getEnvVariable } from "./helper";
import {
  TCampaign,
  TCampaignPageContent,
  THomePageContent,
  TLayoutContent,
  TLocation,
  TProject,
  TProjectPageContent,
  TSewak,
  TSewakWithBio,
  TSocial,
  TStatistic,
  TTeamPageContent,
  TTestimonial,
  TVolunteerPageContent,
} from "./types";

const contentful = createClient({
  accessToken: getEnvVariable("CONTENTFUL_ACCESS_TOKEN"),
  space: getEnvVariable("CONTENTFUL_SPACE_ID"),
  environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
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
    ],
    limit: 1,
  });

  const data = entries.items[0].fields;

  const socials = (data.socials as Entry[]).map((entry) => {
    return { handle: entry.fields.handle, url: entry.fields.url } as TSocial;
  });

  return {
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
      "fields.campaignImages",
      "fields.locations",
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
          const length = node.content.reduce(
            (length, block) => (length += (block as Text).value.length),
            0,
          );
          return (
            <p data-length={length} className="tracking-wider">
              {children}
            </p>
          );
        },
      },
      renderText: (text) => {
        return text.split("\n").reduce((children, textSegment, index) => {
          return [
            ...children,
            index > 0 && <br key={index} />,
            textSegment,
          ] as string[];
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

  const sliderImgUrls = (data.sliderImages as Asset[]).map(
    (asset) => (`https:` + asset.fields.file?.url) as string,
  );
  const missionImgUrls = (data.missionImages as Asset[]).map(
    (asset) => (`https:` + asset.fields.file?.url) as string,
  );
  const visionImgUrls = (data.visionImages as Asset[]).map(
    (asset) => (`https:` + asset.fields.file?.url) as string,
  );
  const campaignImgUrls = (data.campaignImages as Asset[]).map(
    (asset) => (`https:` + asset.fields.file?.url) as string,
  );

  return {
    locations,
    testimonials,
    sliderImgUrls,
    missionImgUrls,
    visionImgUrls,
    campaignImgUrls,
  };
}

export async function getVolunteerPageContent(): Promise<TVolunteerPageContent> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: [
      "fields.volunteerRules",
      "fields.certificateCriteria",
      "fields.volunteerFormLink",
    ],
    limit: 1,
  });

  const data = entries.items[0].fields;

  return {
    volunteerRules: data.volunteerRules as string[],
    certificateCriteria: data.certificateCriteria as string[],
    volunteerFormLink: data.volunteerFormLink as string,
  };
}

export async function getCampaignPageContent(): Promise<TCampaignPageContent> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: ["fields.campaigns"],
    limit: 1,
  });

  const data = entries.items[0].fields;
  const campaigns = (data.campaigns as Array<Entry>)
    .map((c) => {
      const imgUrls = (c.fields.images as Asset[])?.map(
        (asset) => (`https:` + asset.fields.file?.url) as string,
      );
      return {
        imgUrls,
        title: c.fields.title,
        slug: c.fields.slug,
        active: c.fields.active,
        content: c.fields.content as Document,
      } as TCampaign;
    })
    .sort((a, b) => (a.active && !b.active ? 1 : 0));

  return {
    campaigns,
  };
}

export async function getProjectPageContent(): Promise<TProjectPageContent> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: ["fields.projects"],
    limit: 1,
  });

  const data = entries.items[0].fields;
  const projects = (data.projects as Array<Entry>).map((p) => {
    return {
      title: p.fields.title,
      hindiTitle: p.fields.hindiTitle,
      slug: p.fields.slug,
      description: p.fields.description,
      body: p.fields.body as Document,
    } as TProject;
  });

  return {
    projects,
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
  let director: TSewakWithBio | undefined;

  entries.items.forEach((el) => {
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
        renderText: (text) => {
          return text.split("\n").reduce((children, textSegment, index) => {
            return [
              ...children,
              index > 0 && <br key={index} />,
              textSegment,
            ] as string[];
          }, [] as string[]);
        },
      });

    if (member.role === "Founder Trustee") {
      founder = { ...member, bio: parseBio(el.fields.bio as Document) };
    } else if (member.role === "Board of Directors") {
      director = { ...member, bio: parseBio(el.fields.bio as Document) };
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
    founder: founder!,
    director: director!,
    volunteerFormLink: data.volunteerFormLink as string,
  };
}

export const getStatisticsCached = cache(getStatistics);
async function getStatistics(): Promise<{ generalStatistics: TStatistic[] }> {
  const entries = await contentful.getEntries({
    content_type: "misc",
    select: ["fields.projectPageStatistics"],
    limit: 1,
  });

  const data = entries.items[0].fields;

  const generalStatistics = (data.projectPageStatistics as Entry[]).map(
    (stat) => {
      return {
        value: stat.fields.value,
        title: stat.fields.title,
        suffix: stat.fields.suffix,
      } as TStatistic;
    },
  );

  return {
    generalStatistics,
  };
}

const nbsp = String.fromCharCode(160);

export const teamBeliefs = [
  `At Selfless Sewa, our mantra of "Lead${nbsp}by${nbsp}Example" is our guiding light. It’s about walking the talk and setting the bar high in everything we do. We don't just preach; we practice what we believe in—excellence, service, and dedication.`,
  `By leading with integrity and passion, we inspire others to follow suit and join us in our mission of service and empowerment. Our actions speak volumes, showing that making a difference is not just a slogan but a way of life.`,
];

export const projectIcons: Record<string, SymbolCodepoints> = {
  saksham: "auto_stories",
  chikitsa: "digital_wellbeing",
  aahar: "grocery",
  saundarya: "nature",
  "jeev-kalyan": "pets",
  muskaraahat: "mood",
};
