type TSewak = {
  name: string;
  role: string;
  imgUrl: string;
};

type TFounder = TSewak & { bio: string };

type TTeamCardData = {
  founder: TFounder;
  team: TSewak[];
};

type TRules = {
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

type THomeContent = {
  locations: TLocation[];
  sliderImgUrls: string[];
  missionImgUrls: string[];
  visionImgUrls: string[];
};
