const axios = require("axios");

const imageUrl = process.env.IMAGE_URL
const driverImage = imageUrl+ "/driverIcon.png"

async function convertImageToBase64(URL) {
  let image = await axios.get(URL, { responseType: "arraybuffer" });
  let returnedB64 = Buffer.from(image.data).toString("base64");
  return returnedB64;
}

const sendMail = async (message) => {
  // const fileblob = message.file ? await convertImageToBase64(message.file) : null;
  // const fileExt = message.file ? path.extname(message.file) : null;
  // const filename = message.file ? message.file.substring(message.file.lastIndexOf("/") + 1) : fileExt ? `DriverPhoto${fileExt}` : null;
  
  // const file2blob = message.file2 ? await convertImageToBase64(message.file2) : null;
  // const file2Ext = message.file2 ? path.extname(message.file2) : null;
  // const file2name = message.file2 ? message.file2.substring(message.file2.lastIndexOf("/") + 1) : file2Ext ? `GPS_location${file2Ext}` : null;

  const mailOptions = {
    api_key: "",
    to: [message.to],
    sender: "drivers@callahead.com",
    template_id: "",
    template_data: {
      "imageUrl": "http://18.212.205.10/assets/image/logo-small-callahead.png",
      "driverPhoto": message.driverPhoto ? message.driverPhoto : driverImage,
      "driverName": message.driverName,
      "status": message.status !== "success" ? `Reason: • ${message.reason === "Locked" ? "Locked" : message.reason === "Blocked" ? "Blocked" : "Do Not Service requested by a person onsite."}` : null,
      "address": message.address,
      "custNum": message.custNum,
      "dateAndTime": message.dateAndTime,
      "reason": message.reason === "Locked" ? "Locked" : message.reason === "Blocked" ? "Blocked" : "Do Not Service requested by a person onsite.",
      "successData":message.successData,
      "gpsScreenshot": message.GPSScreenshot
  },
    custom_headers: [
      {
        header: "Reply-To",
        value: "Actual Person drivers@callahead.com",
      },
    ],
    // attachments: [],
  };
  // if (filename && filename !== "") {
  //   mailOptions.attachments.push({
  //     filename: filename,
  //     fileblob: fileblob,
  //     mimetype: `application/${fileExt}`,
  //   });
  // }

  // if (file2name && file2name !== "") {
  //   mailOptions.attachments.push({
  //     filename: file2name,
  //     fileblob: file2blob,
  //     mimetype: `application/${file2Ext}`,
  //   });
  // }
    try{
        const res = await axios
        .post("https://api.smtp2go.com/v3/email/send", mailOptions, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        if(res){
          console.log(`Email sent to the ${message.to}`);
        }
    }catch(error){
      console.log(error.response.data);
    }
};

module.exports = { sendMail };
