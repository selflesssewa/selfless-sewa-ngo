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
