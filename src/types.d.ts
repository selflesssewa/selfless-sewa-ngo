type TSewak = {
  name: string;
  role: string;
  imgUrl: string;
};

type TSewakWithBio = TSewak & { bio: string };

type TTeamPageContent = {
  volunteerFormLink: string;
  founder: TSewakWithBio;
  team: TSewak[];
};

type TSocial = {
  handle: string;
  url: string;
};

type TLayoutContent = {
  contactNo: string;
  contactEmailId: string;
  collabEmailId: string;
  donationFormLink: string;
  volunteerFormLink: string;
  socials: TSocial[];
};

type TVolunteerPageContent = {
  volunteerFormLink: string;
  volunteerRules: string[];
  certificateCriteria: string[];
};

type TLocation = {
  label: string;
  lon: number;
  lat: number;
  offsetX: number;
  offsetY: number;
};

type THomePageContent = {
  donationFormLink: string;
  locations: TLocation[];
  sliderImgUrls: string[];
  missionImgUrls: string[];
  visionImgUrls: string[];
};
