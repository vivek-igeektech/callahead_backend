const imageUrl = process.env.IMAGE_URL
const driverImage = imageUrl+ "/driverIcon.png"

module.exports = (
  reason,
  address,
  dateAndTime,
  driverName,
  driverPhoto,
  GPSScreenshot,
  custNum
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
    </head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td width="600" align="center">
  <table width="600" border="0" cellspacing="0" cellpadding="0" >
    <tr>
    <td style="text-align: center; width="100%" align="center">

    <div className="logoImage" alt="logo" style="text-align: center;">
    <img src="{{imageUrl}}" style="height: 60px; width: 100%; object-fit: contain; margin-bottom: 1rem;"/>
    </div>
    
    <div>
    <div
    className="contect"
        style="margin:auto; border:1px solid #F5F5F5; background-color:#f5f5f5; color:#000000; padding: 2rem; border-radius: 10px;"
      >
    <div>

    <div style="margin-top:10px; width:150px; height:150px; display: block; margin: auto;">
    <img src={{driverPhoto}} alt="Driver Photo" style="width:135px; height:135px; border-radius:50%">
    </div>

    <div style="margin-top:15px;">
      <p style="font-size:15px; font-weight: bold; text-align:center">
        Driver Name : {{driverName}}
      </p>
    </div>
    </div>

    <div style="font-size:14px; text-align: left;">
      <p style="text-decoration:none;">
      Your Callahead Technician has partially completed servicing your unit(s) at: {{address}}.
      <p>SITE#: {{custNum}}.</p>
      <p> Date and Time: {{dateAndTime}}. </p>
      </p>
      
      <p>
        Reason:
            •    {{reason}}
      </p>
      <p> Attached is a GPS screenshot of our truck at your location.</p>
      <img style="display:block; margin:auto; height: 400px;" src="{{GPSScreenshot}}" alt="GPS Screensort">

      <p>
      This email is sent by Callahead to keep you informed about your Callahead servicing status.
      Have questions? Please do not reply to this service email. Instead, just contact us at: info@callahead.com or call
      800.634.2085.
      </p>

      <p>
      If you no longer wish to receive Callahead Service email notifications, 
      <a href="mailto:unsubscribe@callahead.com?subject=Callahead%20Service%20email%20notifications&body=Please remove this site ({{custNum}}) from service notifications">Unsubscribe Here.</a>
      </p>

      </div>
      </div>
      </div>
      </td>
      </tr>
  </table>
 </td>
 </tr>
 </table>
 </body>
 </html>`;
};
