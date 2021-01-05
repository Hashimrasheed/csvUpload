const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}
module.exports.connect = function(done) {
    const url = 'mongodb+srv://Hashim:Hashim@30@cluster0.wysex.mongodb.net/CSVTest?retryWrites=true&w=majority'
    const dbname = 'CSVTest'

    mongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
        if(err) return done(err)
        state.db = data.db(dbname)
    })
    done();
}

module.exports.get = function() {
    return state.db
}