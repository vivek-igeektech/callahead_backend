const express = require("express")
const router = express.Router()
const ftpStorage = require("multer-ftp")
const multer = require("multer")
const base_url = process.env.BASE_URL
const sharp = require("sharp")
var FormData = require('form-data');
const axios = require("axios")
const fs = require("fs")
const path = require("path")
const { promisify } = require('util')
const sizeOf = promisify(require('image-size'))

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'images');
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

const upload = multer({
    storage: new ftpStorage({
        basepath: '/images/',
        ftp: {
            host: '',
            secure: false, 
            user: '',
            password: ''
        }   
    })
});

router.post("/image_upload",multer({storage: storage}).single("upload_image"),async (req, res) => {
    try {
        let imageData = fs.readFileSync(`./${req.file.path}`)
        const output_path = req.file.path.split("/")[1]

        const isDriver = req.query.is_driver

        let imageWidth = ""
        let imageHeight = ""

        const dimensions = await sizeOf(path.join(__dirname,`../${req.file.path}`))
        imageWidth = dimensions.width, imageHeight = dimensions.height

        if(isDriver == "true"){
            await sharp(imageData)
            .resize(170, 180)
            .toFile(`imageToBeUpload/${output_path}`)
        }else if(isDriver == "false"){
            if((imageWidth >= 1080) && (imageHeight >= 2285)){
                await sharp(imageData)
                .resize(400, 800)
                .toFile(`imageToBeUpload/${output_path}`)
            }else{
                await sharp(imageData)
                .resize(imageWidth, imageHeight)
                .toFile(`imageToBeUpload/${output_path}`)
            }
        }else{
            await sharp(imageData)
            .resize(320, 240)
            .toFile(`imageToBeUpload/${output_path}`)
        }
        
        const getFilePath = path.join(__dirname,`../${req.file.path}`)
        const fileToBeUpload = path.join(__dirname,`../imageToBeUpload/${output_path}`)
        const formData = new FormData();

        const createdReadStream = fs.createReadStream(fileToBeUpload)
        formData.append('Image', createdReadStream);

            const config = {
                method: 'post',
                url: 'http://18.212.205.10:5000/api/image_upload_to_server',
                headers: {
                    ...formData.getHeaders()
                },
                data: formData,
            };

            axios(config)
            .then(function (response) {
                if(response.data.success === true){
                    fs.unlinkSync(getFilePath);
                    fs.unlinkSync(fileToBeUpload);
                }
                return res.status(200).send({
                    data: response.data.data,
                    success: true
                });
            })
            .catch(function (error) {
                fs.unlinkSync(getFilePath);
                fs.unlinkSync(fileToBeUpload);
                return res.status(200).send({
                    data: error,
                    success: true
                });
            });
    } catch (error) {
        res.status(400).json({
            error: error.message,
            success: false
        })
    }
});

router.post("/image_upload_to_server",upload.single("Image"),async (req, res) => {
    try {
        return res.status(200).send({
            data: `${base_url + req.file.path}`,
            success: true
        });
    } catch (error) {
        res.status(400).json({
            error: error.message,
            success: false
        })
    }
})

module.exports = router