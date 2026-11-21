// Shared Anime Profile Avatar generator and collection
export const ANIME_AVATARS_LIST = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Kenshin&hair=short01,short02&skinColor=f2d3b1',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Sakura&hair=variant02,variant06',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Levi&hair=short04,short05&skinColor=ecad80',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Mikasa&hair=variant01,variant04',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Tanjiro&hair=short03,long03',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Nezuko&hair=variant07,variant09',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Gojo&hair=long02,short06',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Nobara&hair=variant03,variant05',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Naruto&hair=short01,short07',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Hinata&hair=variant08,variant10',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoro&hair=short02,short04',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&hair=variant04,variant12',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Edward&hair=long01,short03',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Asuna&hair=variant05,variant11',
];

export function getRandomAnimeAvatar(nameOrSeed?: string): string {
  if (nameOrSeed) {
    const style = nameOrSeed.length % 2 === 0 ? 'adventurer' : 'lorelei';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(nameOrSeed)}`;
  }
  const randomIndex = Math.floor(Math.random() * ANIME_AVATARS_LIST.length);
  return ANIME_AVATARS_LIST[randomIndex];
}
