export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "CN", name: "中国", flag: "🇨🇳" },
  { code: "US", name: "美国", flag: "🇺🇸" },
  { code: "GB", name: "英国", flag: "🇬🇧" },
  { code: "JP", name: "日本", flag: "🇯🇵" },
  { code: "KR", name: "韩国", flag: "🇰🇷" },
  { code: "AU", name: "澳大利亚", flag: "🇦🇺" },
  { code: "CA", name: "加拿大", flag: "🇨🇦" },
  { code: "DE", name: "德国", flag: "🇩🇪" },
  { code: "FR", name: "法国", flag: "🇫🇷" },
  { code: "IT", name: "意大利", flag: "🇮🇹" },
  { code: "ES", name: "西班牙", flag: "🇪🇸" },
  { code: "NL", name: "荷兰", flag: "🇳🇱" },
  { code: "SG", name: "新加坡", flag: "🇸🇬" },
  { code: "MY", name: "马来西亚", flag: "🇲🇾" },
  { code: "TH", name: "泰国", flag: "🇹🇭" },
  { code: "VN", name: "越南", flag: "🇻🇳" },
  { code: "PH", name: "菲律宾", flag: "🇵🇭" },
  { code: "ID", name: "印度尼西亚", flag: "🇮🇩" },
  { code: "IN", name: "印度", flag: "🇮🇳" },
  { code: "RU", name: "俄罗斯", flag: "🇷🇺" },
  { code: "BR", name: "巴西", flag: "🇧🇷" },
  { code: "MX", name: "墨西哥", flag: "🇲🇽" },
  { code: "AE", name: "阿联酋", flag: "🇦🇪" },
  { code: "SA", name: "沙特阿拉伯", flag: "🇸🇦" },
  { code: "TR", name: "土耳其", flag: "🇹🇷" },
  { code: "ZA", name: "南非", flag: "🇿🇦" },
  { code: "NZ", name: "新西兰", flag: "🇳🇿" },
  { code: "HK", name: "中国香港", flag: "🇭🇰" },
  { code: "TW", name: "中国台湾", flag: "🇹🇼" },
  { code: "MO", name: "中国澳门", flag: "🇲🇴" },
  { code: "PT", name: "葡萄牙", flag: "🇵🇹" },
  { code: "SE", name: "瑞典", flag: "🇸🇪" },
  { code: "NO", name: "挪威", flag: "🇳🇴" },
  { code: "DK", name: "丹麦", flag: "🇩🇰" },
  { code: "FI", name: "芬兰", flag: "🇫🇮" },
  { code: "CH", name: "瑞士", flag: "🇨🇭" },
  { code: "AT", name: "奥地利", flag: "🇦🇹" },
  { code: "BE", name: "比利时", flag: "🇧🇪" },
  { code: "IE", name: "爱尔兰", flag: "🇮🇪" },
  { code: "PL", name: "波兰", flag: "🇵🇱" },
  { code: "CZ", name: "捷克", flag: "🇨🇿" },
  { code: "GR", name: "希腊", flag: "🇬🇷" },
  { code: "IL", name: "以色列", flag: "🇮🇱" },
  { code: "EG", name: "埃及", flag: "🇪🇬" },
  { code: "AR", name: "阿根廷", flag: "🇦🇷" },
  { code: "CL", name: "智利", flag: "🇨🇱" },
  { code: "CO", name: "哥伦比亚", flag: "🇨🇴" },
  { code: "PE", name: "秘鲁", flag: "🇵🇪" },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}
