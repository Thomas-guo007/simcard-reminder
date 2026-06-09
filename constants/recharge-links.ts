// 常用运营商充值链接
export interface CarrierRechargeInfo {
  carrier: string;
  country: string;
  url: string;
}

export const CARRIER_RECHARGE_LINKS: CarrierRechargeInfo[] = [
  // 中国
  { carrier: "中国移动", country: "CN", url: "https://shop.10086.cn/i/" },
  { carrier: "中国联通", country: "CN", url: "https://e.10010.com/" },
  { carrier: "中国电信", country: "CN", url: "https://www.189.cn/" },
  { carrier: "China Mobile", country: "CN", url: "https://shop.10086.cn/i/" },
  { carrier: "China Unicom", country: "CN", url: "https://e.10010.com/" },
  { carrier: "China Telecom", country: "CN", url: "https://www.189.cn/" },

  // 美国
  { carrier: "T-Mobile", country: "US", url: "https://www.t-mobile.com/prepaid" },
  { carrier: "AT&T", country: "US", url: "https://www.att.com/prepaid/" },
  { carrier: "Verizon", country: "US", url: "https://www.verizon.com/prepaid/" },
  { carrier: "Mint Mobile", country: "US", url: "https://www.mintmobile.com/account" },
  { carrier: "Ultra Mobile", country: "US", url: "https://www.ultramobile.com/account" },

  // 英国
  { carrier: "Vodafone", country: "GB", url: "https://www.vodafone.co.uk/top-up" },
  { carrier: "EE", country: "GB", url: "https://top-up.ee.co.uk/" },
  { carrier: "Three", country: "GB", url: "https://www.three.co.uk/top-up" },
  { carrier: "O2", country: "GB", url: "https://www.o2.co.uk/topup" },
  { carrier: "giffgaff", country: "GB", url: "https://www.giffgaff.com/top-up" },

  // 日本
  { carrier: "NTT Docomo", country: "JP", url: "https://www.docomo.ne.jp/" },
  { carrier: "au/KDDI", country: "JP", url: "https://www.au.com/" },
  { carrier: "SoftBank", country: "JP", url: "https://www.softbank.jp/" },
  { carrier: "Rakuten Mobile", country: "JP", url: "https://network.mobile.rakuten.co.jp/" },

  // 韩国
  { carrier: "SK Telecom", country: "KR", url: "https://www.tworld.co.kr/" },
  { carrier: "KT", country: "KR", url: "https://www.kt.com/" },
  { carrier: "LG U+", country: "KR", url: "https://www.lguplus.com/" },

  // 澳大利亚
  { carrier: "Telstra", country: "AU", url: "https://www.telstra.com.au/prepaid" },
  { carrier: "Optus", country: "AU", url: "https://www.optus.com.au/prepaid" },
  { carrier: "Vodafone AU", country: "AU", url: "https://www.vodafone.com.au/prepaid" },

  // 加拿大
  { carrier: "Rogers", country: "CA", url: "https://www.rogers.com/plans/prepaid" },
  { carrier: "Bell", country: "CA", url: "https://www.bell.ca/Mobility/Prepaid" },
  { carrier: "Telus", country: "CA", url: "https://www.telus.com/en/mobility/prepaid" },

  // 德国
  { carrier: "Telekom", country: "DE", url: "https://www.telekom.de/prepaid" },
  { carrier: "Vodafone DE", country: "DE", url: "https://www.vodafone.de/prepaid/" },
  { carrier: "O2 DE", country: "DE", url: "https://www.o2online.de/prepaid/" },

  // 法国
  { carrier: "Orange", country: "FR", url: "https://boutique.orange.fr/prepaid" },
  { carrier: "SFR", country: "FR", url: "https://www.sfr.fr/forfait-mobile/prepaye" },
  { carrier: "Free Mobile", country: "FR", url: "https://mobile.free.fr/" },

  // 新加坡
  { carrier: "Singtel", country: "SG", url: "https://www.singtel.com/personal/products-plans/mobile/prepaid" },
  { carrier: "StarHub", country: "SG", url: "https://www.starhub.com/personal/mobile-plans/prepaid-plans.html" },
  { carrier: "M1", country: "SG", url: "https://www.m1.com.sg/personal/mobile/prepaid" },

  // 马来西亚
  { carrier: "Maxis", country: "MY", url: "https://www.maxis.com.my/prepaid/" },
  { carrier: "Digi", country: "MY", url: "https://www.digi.com.my/prepaid" },
  { carrier: "Celcom", country: "MY", url: "https://www.celcom.com.my/prepaid" },

  // 泰国
  { carrier: "AIS", country: "TH", url: "https://www.ais.th/prepaid/" },
  { carrier: "DTAC", country: "TH", url: "https://www.dtac.co.th/prepaid" },
  { carrier: "TrueMove", country: "TH", url: "https://www.truemoveh.truecorp.co.th/" },

  // 印度
  { carrier: "Jio", country: "IN", url: "https://www.jio.com/recharge" },
  { carrier: "Airtel", country: "IN", url: "https://www.airtel.in/recharge/" },
  { carrier: "Vi", country: "IN", url: "https://www.myvi.in/recharge" },

  // 台湾
  { carrier: "中华电信", country: "TW", url: "https://www.cht.com.tw/home/consumer/mobile/prepaid" },
  { carrier: "台湾大哥大", country: "TW", url: "https://www.taiwanmobile.com/cs/prepaid" },
  { carrier: "远传电信", country: "TW", url: "https://www.fetnet.net/content/cbu/tw/postpaid/prepaid.html" },

  // 香港
  { carrier: "3HK", country: "HK", url: "https://www.three.com.hk/prepaid" },
  { carrier: "CSL", country: "HK", url: "https://www.hkcsl.com/en/Prepaid-SIM/" },
  { carrier: "SmarTone", country: "HK", url: "https://www.smartone.com/en/prepaid/" },
  { carrier: "CMHK", country: "HK", url: "https://www.hk.chinamobile.com/en/prepaid-sim.html" },
];

// 根据运营商名称和国家匹配充值链接
export function findRechargeLink(carrier: string, country: string): string | null {
  const normalizedCarrier = carrier.toLowerCase().trim();
  const match = CARRIER_RECHARGE_LINKS.find(
    (item) =>
      item.country === country &&
      item.carrier.toLowerCase().includes(normalizedCarrier) ||
      normalizedCarrier.includes(item.carrier.toLowerCase())
  );
  return match?.url || null;
}

// 获取某个国家的所有运营商充值链接
export function getCarriersByCountry(country: string): CarrierRechargeInfo[] {
  return CARRIER_RECHARGE_LINKS.filter((item) => item.country === country);
}
