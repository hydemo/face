import * as mongoose from 'mongoose';
import * as moment from 'moment';

const getAge = (cardNumber) => {
  const thisYear = moment().format('YYYY')
  if (cardNumber.length > 15) {
    const birthYear = cardNumber.slice(6, 10)
    return Number(thisYear) - Number(birthYear)
  } else {
    const birthYear = `19${cardNumber.slice(6, 8)}`
    return Number(thisYear) - Number(birthYear)
  }

}

export const UserSchema = new mongoose.Schema(
  {
    // 密码
    password: String,
    // 注册时间
    registerTime: Date,
    // 注册ip
    registerIp: String,
    // 手机
    phone: { type: String },
    // 微信id
    openId: { type: String },
    // 头像
    avatar: String,
    // 性别
    gender: Number,
    // 昵称
    username: String,
    // 最后登录时间
    lastLoginTime: Date,
    // 最后登录ip
    lastLoginIp: String,
    // 国家
    country: String,
    // 省份
    province: String,
    // 城市
    city: String,
    // 人脸图片
    faceUrl: String,
    // 身份证号
    cardNumber: { type: String, unique: true },
    // unionId
    unionId: String,
    // 是否删除
    isBlock: { type: Boolean, default: false },
    // 是否实名认证
    isVerify: { type: Boolean, default: false },
    // 是否手机认证
    isPhoneVerify: { type: Boolean, default: false },
  },
  { collection: 'user', versionKey: false, timestamps: true },
);

UserSchema.post('find', function (results: any) {
  results.map(result => {
    if (result.cardNumber) {
      const number = result.cardNumber;
      const replaceStr = number.substring(4, 13);
      const str = '*'.repeat(replaceStr.length)
      result.cardNumber = number.replace(replaceStr, str);
    }
  })
})

UserSchema.post('findOne', function (result: any) {
  if (result && result.cardNumber) {
    const number = result.cardNumber;
    const thisYear = moment().format('YYYY')
    if (number.length > 15) {
      const birthYear = number.slice(6, 10)
      result.age = Number(thisYear) - Number(birthYear)
    } else {
      const birthYear = `19${number.slice(6, 8)}`
      result.age = Number(thisYear) - Number(birthYear)
    }
    const replaceStr = number.substring(4, 13);
    const str = '*'.repeat(replaceStr.length)
    result.cardNumber = number.replace(replaceStr, str);
  }
})

