const capitalize = (str: string) => {
    if (!str) return ''
    if (str.length <= 1) return str.toUpperCase()
    return str.toUpperCase()[0] + str.slice(1)
}

function formatDate(timestamp: number, locale: string = 'en') {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (locale === 'zh') {
      if (diffInSeconds < 60) {
        return '刚刚';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} 分钟前`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} 小时前`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} 天前`;
      }
    }

    // 默认英文
    if (diffInSeconds < 60) {
      return 'Just Now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  }

// 分类名称中英文映射表
const categoryTranslations: Record<string, string> = {
  // 系统默认分类
  'personal': '个人',
  'personal_details': '个人信息',
  'family': '家庭',
  'professional_details': '职业信息',
  'sports': '运动',
  'travel': '旅行',
  'food': '美食',
  'music': '音乐',
  'health': '健康',
  'technology': '科技',
  'hobbies': '兴趣爱好',
  'fashion': '时尚',
  'entertainment': '娱乐',
  'milestones': '里程碑',
  'user_preferences': '用户偏好',
  'misc': '其他',

  // API 返回的常见分类
  'relationships': '人际关系',
  'preferences': '偏好',
  'work': '工作',
  'education': '教育',
  'projects': '项目',
  'to-dos': '待办事项',
  'ai, ml & technology': '人工智能与科技',
  'technical support': '技术支持',
  'finance': '财务',
  'shopping': '购物',
  'legal': '法律',
  'messages': '消息',
  'customer support': '客户支持',
  'product feedback': '产品反馈',
  'news': '新闻',
  'organization': '组织管理',
  'goals': '目标',
  'weather': '天气',
  'lifestyle': '生活方式',
  'coding': '编程',
  'programming': '编程',
  'development': '开发',
  'design': '设计',
  'art': '艺术',
  'business': '商务',
  'career': '职业',
  'wellness': '健康',
  'fitness': '健身',
  'mental': '心理',
  'social': '社交',
  'life': '生活',
};

function translateCategory(category: string, locale: string = 'en'): string {
  if (locale !== 'zh') return category;
  const key = category.toLowerCase().trim();
  return categoryTranslations[key] || category;
}

export { capitalize, formatDate, translateCategory }