const db = require('../../config/connection');
const collection = require('../../config/collections')
const csvtojson = require("csvtojson");
var ObjectID = require('mongodb').ObjectID;
const { json } = require('body-parser');
const amqp = require('amqplib/callback_api')

function userController() {
    return {
        async home(req, res) {
            try {
                let ids = await db.get().collection(collection.CSVUPLOAD).aggregate([]).toArray();
                res.render('user/home', { ids })
            } catch (e) {
                ids = ''
                res.render('user/home', { ids })
            }

        },
        async generate(req, res) {
            let objId = new ObjectID
            res.render('user/addfile', { objId })
        },
        async addfile(req, res) {
            let csvData = req.files.csvfile.data.toString();
            let csvfile = req.files.csvfile
            let id = req.params.id
            await csvtojson().fromString(csvData).then(json => {
                csvfile.mv(`public/csvfiles/${id}.csv`, async (err) => {
                    if (!err) {
                        amqp.connect('amqps://ffvqpvmk:njT7VxX-BGBRk4ZOMohI7JSfYW2V1Z4H@owl.rmq.cloudamqp.com/ffvqpvmk', (connError, connection) => {
                            if (connError) {
                                throw connError;
                            }
                            connection.createChannel((channelError, channel) => {
                                if (channelError) {
                                    throw channelError;
                                }
                                const QUEUE = 'CSVTEST'
                                channel.assertQueue(QUEUE);
                                let obj = { id: id, path: `public/csvfiles/${id}.csv` }
                                channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(obj)));
                                console.log(`message send ${QUEUE}`);

                            })

                        })
                        amqp.connect('amqps://ffvqpvmk:njT7VxX-BGBRk4ZOMohI7JSfYW2V1Z4H@owl.rmq.cloudamqp.com/ffvqpvmk', (connError, connection) => {
                            if (connError) {
                                throw connError;
                            }
                            connection.createChannel((channelError, channel) => {
                                if (channelError) {
                                    throw channelError;
                                }
                                const QUEUE = 'CSVTEST'
                                channel.assertQueue(QUEUE);
                                channel.consume(QUEUE, (msg) => {
                                    console.log(`message is ${msg.content}`);
                                    let json = JSON.parse(msg.content.toString())
                                    csvtojson().fromFile(json.path).then(async (data) => {
                                        await db.get().collection(collection.CSVUPLOAD).insertOne({ _id: ObjectID(json.id), details: data })
                                        res.redirect(`/`)
                                    })

                                }, {
                                    noAck: true
                                })
                            })

                        })
                    } else {
                        console.log(err);
                    }
                })
            })
        },
        async singleFile(req, res) {
            try {
                let id = req.params.id;
                let data = await db.get().collection(collection.CSVUPLOAD).findOne({ _id: ObjectID(id) })
                console.log(data);
                res.json(data)
            } catch (error) {
                throw error
            }

        }
    }
}

module.exports = userController;