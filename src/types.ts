import { Document } from "@contentful/rich-text-types";

export type TSewak = {
  name: string;
  role: string;
  imgUrl: string;
};

export type TSewakWithBio = TSewak & { bio: React.ReactNode };

export type TTeamPageContent = {
  volunteerFormLink: string;
  founder: TSewakWithBio;
  director: TSewakWithBio;
  team: TSewak[];
};

export type TSocial = {
  handle: string;
  url: string;
};

export type TLayoutContent = {
  contactNo: string;
  contactEmailId: string;
  collabEmailId: string;
  volunteerFormLink: string;
  socials: TSocial[];
};

export type TVolunteerPageContent = {
  volunteerFormLink: string;
  volunteerRules: string[];
  certificateCriteria: string[];
};

export type TLocation = {
  label: string;
  lon: number;
  lat: number;
  offsetX: number;
  offsetY: number;
};

export type THomePageContent = {
  locations: TLocation[];
  testimonials: TTestimonial[];
  sliderImgUrls: string[];
  missionImgUrls: string[];
  visionImgUrls: string[];
};

export type TTestimonial = {
  name: string;
  role: string;
  content: React.ReactNode;
};

export type TProject = {
  title: string;
  hindiTitle: string;
  slug: string;
  description: string;
  body: Document;
};

export type TProjectPageContent = {
  projects: Array<TProject>;
};

export type TStatistic = {
  value: number;
  title: string;
  suffix?: string;
};
