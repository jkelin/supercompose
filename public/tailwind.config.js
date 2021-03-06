const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      xs: '475px',
      ...defaultTheme.screens,
    },
    spacing: {
      0: '0px',
      1: '1px',
      2: '2px',
      3: '3px',
      4: '4px',
      5: '5px',
      6: '6px',
      7: '7px',
      8: '8px',
      9: '9px',
      10: '10px',
      11: '11px',
      12: '12px',
      13: '13px',
      14: '14px',
      15: '15px',
      16: '16px',
      17: '17px',
      18: '18px',
      19: '19px',
      20: '20px',
      21: '21px',
      22: '22px',
      23: '23px',
      24: '24px',
      25: '25px',
      26: '26px',
      27: '27px',
      28: '28px',
      29: '29px',
      30: '30px',
      31: '31px',
      32: '32px',
      33: '33px',
      34: '34px',
      35: '35px',
      36: '36px',
      37: '37px',
      38: '38px',
      39: '39px',
      40: '40px',
      41: '41px',
      42: '42px',
      43: '43px',
      44: '44px',
      45: '45px',
      46: '46px',
      47: '47px',
      48: '48px',
      49: '49px',
      50: '50px',
      55: '55px',
      60: '60px',
      64: '64px',
      65: '65px',
      70: '70px',
      75: '75px',
      80: '80px',
      85: '85px',
      90: '90px',
      95: '95px',
      100: '100px',
      110: '110px',
      120: '120px',
      130: '130px',
      140: '140px',
      150: '150px',
      160: '160px',
      170: '170px',
      180: '180px',
      190: '190px',
      200: '200px',
      210: '210px',
      220: '220px',
      230: '230px',
      240: '240px',
      250: '250px',
      260: '260px',
      270: '270px',
      280: '280px',
      290: '290px',
      300: '300px',
      310: '310px',
      320: '320px',
      330: '330px',
      340: '340px',
      350: '350px',
      360: '360px',
      370: '370px',
      380: '380px',
      390: '390px',
      400: '400px',
      410: '410px',
      420: '420px',
      430: '430px',
      440: '440px',
      450: '450px',
      460: '460px',
      470: '470px',
      480: '480px',
      490: '490px',
      500: '500px',
      400: '400px',
      410: '410px',
      420: '420px',
      430: '430px',
      440: '440px',
      450: '450px',
      460: '460px',
      470: '470px',
      480: '480px',
      490: '490px',
      500: '500px',
      510: '510px',
      520: '520px',
      530: '530px',
      540: '540px',
      550: '550px',
      560: '560px',
      570: '570px',
      580: '580px',
      590: '590px',
      600: '600px',
      610: '610px',
      620: '620px',
      630: '630px',
      640: '640px',
      650: '650px',
      660: '660px',
      670: '670px',
      680: '680px',
      690: '690px',
      700: '700px',
      710: '710px',
      720: '720px',
      730: '730px',
      740: '740px',
      750: '750px',
      760: '760px',
      770: '770px',
      780: '780px',
      790: '790px',
      800: '800px',
      810: '810px',
      820: '820px',
      830: '830px',
      840: '840px',
      850: '850px',
      860: '860px',
      870: '870px',
      880: '880px',
      890: '890px',
      900: '900px',
      910: '910px',
      920: '920px',
      930: '930px',
      940: '940px',
      950: '950px',
      960: '960px',
      970: '970px',
      980: '980px',
      990: '990px',
      1000: '1000px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      gridTemplateColumns: {
        layout: '300px auto 300px',
      },
      boxShadow: {
        landing: '0px 3.99353px 7.98706px 1.99676px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  variants: {
    extend: {
      borderRadius: ['last'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
