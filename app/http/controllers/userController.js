const db = require('../../config/connection');
const collection = require('../../config/collections')
const csvtojson = require("csvtojson");
var ObjectID = require('mongodb').ObjectID;
const { json } = require('body-parser');
const amqp = require('amqplib/callback_api')

function userController() {
    return {
        async home(req, res) {
            let ids = await db.get().collection(collection.CSVUPLOAD).aggregate([]).toArray();

            try {
                res.render('user/home', { ids })
            } catch (e) {
                ids = null
                res.render('user/home', { ids })
            }

        },
        async generate(req, res) {
            let objId = new ObjectID
            res.render('user/addfile', { objId })
        },
        async addfile(req, res) {
            try {
                let csvData = req.files.csvfile.data.toString();
                let csvfile = req.files.csvfile
                let id = req.params.id
                await csvtojson().fromString(csvData).then(() => {
                    csvfile.mv(`public/csvfiles/${id}.csv`, async (err) => {
                        if (!err) {
                            await amqp.connect('amqps://ffvqpvmk:njT7VxX-BGBRk4ZOMohI7JSfYW2V1Z4H@owl.rmq.cloudamqp.com/ffvqpvmk', async (connError, connection) => {
                                if (connError) {
                                    throw connError;
                                }
                                await connection.createChannel(async (channelError, channel) => {
                                    if (channelError) {
                                        throw channelError;
                                    }
                                    const QUEUE = 'CSVTEST'
                                    await channel.assertQueue(QUEUE);
                                    let obj = { id: id, path: `public/csvfiles/${id}.csv` }
                                    await channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(obj)));
                                    console.log(`message send ${QUEUE}`);
                                    // await channel.close()

                                })
                                // await connection.close()

                            })
                            await amqp.connect('amqps://ffvqpvmk:njT7VxX-BGBRk4ZOMohI7JSfYW2V1Z4H@owl.rmq.cloudamqp.com/ffvqpvmk', async (connError, connection) => {
                                if (connError) {
                                    throw connError;
                                }
                                await connection.createChannel(async (channelError, channel) => {
                                    if (channelError) {
                                        throw channelError;
                                    }
                                    const QUEUE = 'CSVTEST'
                                    await channel.assertQueue(QUEUE);
                                    await channel.consume(QUEUE, (msg) => {
                                        console.log(`message is ${msg.content}`);
                                        let json = JSON.parse(msg.content.toString())
                                        csvtojson().fromFile(json.path).then((data) => {
                                            db.get().collection(collection.CSVUPLOAD).insertOne({ _id: ObjectID(json.id), details: data })
                                        })
                                    }, {
                                        noAck: true
                                    })
                                })
                                res.redirect(`/`)
                            })
                        } else {
                            res.redirect(`/generate`)
                        }
                    })
                })
            } catch (e) {
                throw e
            }

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