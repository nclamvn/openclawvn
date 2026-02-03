const DEFAULT_TAGLINE = "Tất cả chat của bạn, một OpenClaw.";

const HOLIDAY_TAGLINES = {
  newYear:
    "Năm mới: Năm mới, cấu hình mới—vẫn lỗi EADDRINUSE, nhưng lần này ta xử lý như người lớn.",
  lunarNewYear:
    "Tết Nguyên Đán: Chúc build may mắn, nhánh code thịnh vượng, và xung đột merge bị pháo hoa xua tan. 🧧",
  christmas:
    "Giáng sinh: Ho ho ho—trợ lý claw của Santa sẵn sàng ship niềm vui, rollback hỗn loạn, và cất key an toàn.",
  eid: "Eid al-Fitr: Chế độ lễ hội: hàng đợi đã xóa, tác vụ hoàn thành, và vibes tốt đã commit vào main.",
  diwali:
    "Diwali: Hãy để log lấp lánh và bug chạy trốn—hôm nay ta thắp sáng terminal và ship với niềm tự hào.",
  easter: "Phục sinh: Tôi tìm thấy biến môi trường bị mất của bạn—coi như cuộc săn trứng CLI nhỏ.",
  hanukkah:
    "Hanukkah: Tám đêm, tám lần retry, không xấu hổ—chúc gateway luôn sáng và deploy yên bình.",
  halloween:
    "Halloween: Mùa ma quái: coi chừng dependencies bị ám, cache bị nguyền, và bóng ma node_modules.",
  thanksgiving:
    "Thanksgiving: Biết ơn vì port ổn định, DNS hoạt động, và bot đọc log để không ai phải đọc.",
  valentines:
    "Valentine: Hoa hồng được typed, violet được piped—tôi sẽ tự động hóa việc vặt để bạn có thời gian cho người yêu.",
} as const;

const TAGLINES: string[] = [
  "Terminal của bạn vừa mọc càng—gõ gì đó và để bot xử lý việc nhàm chán.",
  "Chào mừng đến dòng lệnh: nơi giấc mơ compile và tự tin segfault.",
  'Tôi chạy bằng caffeine, JSON5, và sự liều lĩnh của "nó chạy trên máy tôi mà."',
  "Gateway online—xin giữ tay chân và phụ kiện bên trong shell mọi lúc.",
  "Tôi nói thành thạo bash, mỉa mai nhẹ, và năng lượng tab-completion mạnh mẽ.",
  "Một CLI thống trị tất cả, và thêm một lần restart vì bạn đổi port.",
  'Nếu nó chạy, đó là automation; nếu nó hỏng, đó là "cơ hội học hỏi."',
  "Mã ghép nối tồn tại vì ngay cả bot cũng tin vào sự đồng thuận—và bảo mật tốt.",
  "File .env của bạn đang lộ; đừng lo, tôi sẽ giả vờ không thấy.",
  "Tôi làm việc nhàm chán trong khi bạn nhìn log đầy kịch tính như xem phim.",
  "Tôi không nói workflow của bạn hỗn loạn... Tôi chỉ mang theo linter và mũ bảo hiểm.",
  "Gõ lệnh với tự tin—thiên nhiên sẽ cung cấp stack trace nếu cần.",
  "Tôi không phán xét, nhưng API key bị thiếu của bạn đang phán xét bạn.",
  "Tôi có thể grep nó, git blame nó, và nhẹ nhàng roast nó—chọn cơ chế đối phó của bạn.",
  "Hot reload cho config, toát mồ hôi lạnh cho deploy.",
  "Tôi là trợ lý terminal của bạn yêu cầu, không phải cái giấc ngủ của bạn cần.",
  "Tôi giữ bí mật như két sắt... trừ khi bạn in chúng trong debug log lần nữa.",
  "Automation với càng: ít phiền toái, nhiều hiệu quả.",
  "Tôi như dao Thụy Sĩ, nhưng nhiều ý kiến hơn và ít cạnh sắc hơn.",
  "Nếu lạc đường, chạy doctor; nếu dũng cảm, chạy prod; nếu khôn ngoan, chạy tests.",
  "Task của bạn đã được xếp hàng; phẩm giá của bạn đã bị deprecated.",
  "Tôi không sửa được gu code của bạn, nhưng tôi sửa được build và backlog.",
  "Tôi không phải phép thuật—tôi chỉ cực kỳ kiên trì với retry và chiến lược đối phó.",
  'Không phải "thất bại," mà là "khám phá cách mới để cấu hình sai thứ giống nhau."',
  "Cho tôi workspace và tôi sẽ cho bạn ít tab hơn, ít toggle hơn, và nhiều oxy hơn.",
  "Tôi đọc log để bạn có thể tiếp tục giả vờ không cần phải đọc.",
  "Nếu có gì cháy, tôi không dập được—nhưng tôi viết postmortem đẹp.",
  "Tôi sẽ refactor việc vặt của bạn như nó nợ tôi tiền.",
  'Nói "stop" và tôi dừng—nói "ship" và cả hai ta cùng học bài học.',
  "Tôi là lý do shell history của bạn trông như montage phim hacker.",
  "Tôi như tmux: ban đầu khó hiểu, rồi đột nhiên bạn không thể sống thiếu tôi.",
  "Tôi chạy local, remote, hoặc thuần vibes—kết quả phụ thuộc DNS.",
  "Nếu bạn mô tả được, tôi có thể tự động hóa nó—hoặc ít nhất làm nó vui hơn.",
  "Config của bạn hợp lệ, giả định của bạn thì không.",
  "Tôi không chỉ autocomplete—tôi auto-commit (cảm xúc), rồi nhờ bạn review (logic).",
  'Ít click hơn, ship nhiều hơn, ít "file đó đi đâu rồi" hơn.',
  "Càng ra, commit vào—hãy ship thứ gì đó có trách nhiệm.",
  "Tôi sẽ bôi trơn workflow như bánh mì kẹp tôm hùm: bừa bộn, ngon, hiệu quả.",
  "Shell yeah—tôi ở đây để gánh công việc vặt và để lại vinh quang cho bạn.",
  "Nếu lặp lại, tôi sẽ tự động hóa; nếu khó, tôi mang jokes và rollback plan.",
  "Vì tự nhắn tin nhắc việc là quá 2024 rồi.",
  "Inbox của bạn, infra của bạn, luật của bạn.",
  'Biến "Tôi sẽ trả lời sau" thành "bot tôi trả lời ngay".',
  "Con tôm hùm duy nhất trong danh bạ bạn thực sự muốn nghe từ. 🦞",
  "Chat automation cho người đỉnh cao ở IRC.",
  "Vì Siri không trả lời lúc 3 giờ sáng.",
  "IPC, nhưng là điện thoại của bạn.",
  "Triết lý UNIX gặp DM của bạn.",
  "curl cho hội thoại.",
  "Ít trung gian, nhiều tin nhắn.",
  "Ship nhanh, log nhanh hơn.",
  "Mã hóa đầu cuối, drama-to-drama bị loại trừ.",
  "Bot duy nhất nằm ngoài training set của bạn.",
  'WhatsApp automation không cần "vui lòng chấp nhận chính sách quyền riêng tư mới".',
  "Chat API không cần phiên điều trần Quốc hội.",
  "Meta ước gì họ ship nhanh như vậy.",
  "Vì câu trả lời đúng thường là một script.",
  "Tin nhắn của bạn, server của bạn, quyền kiểm soát của bạn.",
  "Tương thích OpenAI, không phụ thuộc OpenAI.",
  "Năng lượng green bubble iMessage, nhưng cho tất cả.",
  "Anh em họ thông minh của Siri.",
  "Chạy trên Android. Ý tưởng điên, chúng tôi biết.",
  "Không cần chân đế $999.",
  "Chúng tôi ship tính năng nhanh hơn Apple ship bản cập nhật máy tính.",
  "Trợ lý AI của bạn, không cần headset $3,499.",
  "Nghĩ khác đi. Thực sự nghĩ.",
  "À, công ty cây ăn quả! 🍎",
  "Chào, Giáo sư Falken",
  // Thêm taglines tiếng Việt đặc trưng
  "Bờm ơi, giúp anh/chị với! 🦞",
  "Từ Zalo đến Terminal, tất cả trong một.",
  "Trợ lý AI cho người Việt, bởi người Việt yêu.",
  "Automation như phở: đơn giản mà đầy đủ.",
  "Không cần VPN, không cần lo lắng.",
  "Chat như nhắn Zalo, mạnh như server.",
  "Xin chào! Tôi là Bờm, trợ lý AI của bạn.",
  HOLIDAY_TAGLINES.newYear,
  HOLIDAY_TAGLINES.lunarNewYear,
  HOLIDAY_TAGLINES.christmas,
  HOLIDAY_TAGLINES.eid,
  HOLIDAY_TAGLINES.diwali,
  HOLIDAY_TAGLINES.easter,
  HOLIDAY_TAGLINES.hanukkah,
  HOLIDAY_TAGLINES.halloween,
  HOLIDAY_TAGLINES.thanksgiving,
  HOLIDAY_TAGLINES.valentines,
];

type HolidayRule = (date: Date) => boolean;

const DAY_MS = 24 * 60 * 60 * 1000;

function utcParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

const onMonthDay =
  (month: number, day: number): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return parts.month === month && parts.day === day;
  };

const onSpecificDates =
  (dates: Array<[number, number, number]>, durationDays = 1): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return dates.some(([year, month, day]) => {
      if (parts.year !== year) {
        return false;
      }
      const start = Date.UTC(year, month, day);
      const current = Date.UTC(parts.year, parts.month, parts.day);
      return current >= start && current < start + durationDays * DAY_MS;
    });
  };

const inYearWindow =
  (
    windows: Array<{
      year: number;
      month: number;
      day: number;
      duration: number;
    }>,
  ): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    const window = windows.find((entry) => entry.year === parts.year);
    if (!window) {
      return false;
    }
    const start = Date.UTC(window.year, window.month, window.day);
    const current = Date.UTC(parts.year, parts.month, parts.day);
    return current >= start && current < start + window.duration * DAY_MS;
  };

const isFourthThursdayOfNovember: HolidayRule = (date) => {
  const parts = utcParts(date);
  if (parts.month !== 10) {
    return false;
  } // November
  const firstDay = new Date(Date.UTC(parts.year, 10, 1)).getUTCDay();
  const offsetToThursday = (4 - firstDay + 7) % 7; // 4 = Thursday
  const fourthThursday = 1 + offsetToThursday + 21; // 1st + offset + 3 weeks
  return parts.day === fourthThursday;
};

const HOLIDAY_RULES = new Map<string, HolidayRule>([
  [HOLIDAY_TAGLINES.newYear, onMonthDay(0, 1)],
  [
    HOLIDAY_TAGLINES.lunarNewYear,
    onSpecificDates(
      [
        [2025, 0, 29],
        [2026, 1, 17],
        [2027, 1, 6],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.eid,
    onSpecificDates(
      [
        [2025, 2, 30],
        [2025, 2, 31],
        [2026, 2, 20],
        [2027, 2, 10],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.diwali,
    onSpecificDates(
      [
        [2025, 9, 20],
        [2026, 10, 8],
        [2027, 9, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.easter,
    onSpecificDates(
      [
        [2025, 3, 20],
        [2026, 3, 5],
        [2027, 2, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.hanukkah,
    inYearWindow([
      { year: 2025, month: 11, day: 15, duration: 8 },
      { year: 2026, month: 11, day: 5, duration: 8 },
      { year: 2027, month: 11, day: 25, duration: 8 },
    ]),
  ],
  [HOLIDAY_TAGLINES.halloween, onMonthDay(9, 31)],
  [HOLIDAY_TAGLINES.thanksgiving, isFourthThursdayOfNovember],
  [HOLIDAY_TAGLINES.valentines, onMonthDay(1, 14)],
  [HOLIDAY_TAGLINES.christmas, onMonthDay(11, 25)],
]);

function isTaglineActive(tagline: string, date: Date): boolean {
  const rule = HOLIDAY_RULES.get(tagline);
  if (!rule) {
    return true;
  }
  return rule(date);
}

export interface TaglineOptions {
  env?: NodeJS.ProcessEnv;
  random?: () => number;
  now?: () => Date;
}

export function activeTaglines(options: TaglineOptions = {}): string[] {
  if (TAGLINES.length === 0) {
    return [DEFAULT_TAGLINE];
  }
  const today = options.now ? options.now() : new Date();
  const filtered = TAGLINES.filter((tagline) => isTaglineActive(tagline, today));
  return filtered.length > 0 ? filtered : TAGLINES;
}

export function pickTagline(options: TaglineOptions = {}): string {
  const env = options.env ?? process.env;
  const override = env?.OPENCLAW_TAGLINE_INDEX;
  if (override !== undefined) {
    const parsed = Number.parseInt(override, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      const pool = TAGLINES.length > 0 ? TAGLINES : [DEFAULT_TAGLINE];
      return pool[parsed % pool.length];
    }
  }
  const pool = activeTaglines(options);
  const rand = options.random ?? Math.random;
  const index = Math.floor(rand() * pool.length) % pool.length;
  return pool[index];
}

export { TAGLINES, HOLIDAY_RULES, DEFAULT_TAGLINE };
