'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { Review } = require('../src/db/reviewModel');
const cfg = require('../config');

async function run() {
  await mongoose.connect(cfg.mongo.uri, { dbName: cfg.mongo.dbName });
  console.log('Connected to DB');

  let updatedCount = 0;
  const cursor = Review.find().cursor();
  
  for await (const doc of cursor) {
    let changed = false;

    if (doc.text) {
      const cleanText = doc.text.replace(/^["“”\s]+|["“”\s]+$/g, '');
      if (cleanText !== doc.text) {
        doc.text = cleanText;
        changed = true;
      }
    }

    if (doc.ownerReply && doc.ownerReply.text) {
      let cleanReply = doc.ownerReply.text.replace(/^Response from the owner.*?ago\s*/i, '').trim();
      cleanReply = cleanReply.replace(/^["“”\s]+|["“”\s]+$/g, '');
      if (cleanReply !== doc.ownerReply.text) {
        doc.ownerReply.text = cleanReply;
        changed = true;
      }
    }

    if (changed) {
      await doc.save();
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} reviews.`);
  await mongoose.disconnect();
}

run().catch(console.error);
