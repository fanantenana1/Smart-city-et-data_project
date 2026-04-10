#!/usr/bin/env python
"""Test MongoDB connection"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

# Read URI from cle.txt
def read_mongo_uri():
    cle_path = os.path.join(os.path.dirname(__file__), 'cle.txt')
    if os.path.exists(cle_path):
        with open(cle_path, 'r', encoding='utf-8') as f:
            for line in f:
                if 'mongodb' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        return parts[1].strip()
    return None

uri = read_mongo_uri()
if not uri:
    print(" No MongoDB URI found in cle.txt")
    sys.exit(1)

print(f" Testing connection to: {uri}")

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    # Test the connection
    client.admin.command('ping')
    print(" MongoDB connection successful!")

    # Test database access
    db = client['DaB_Poubelles']
    collections = db.list_collection_names()
    print(f" Database 'DaB_Poubelles' collections: {collections}")

    # Test users collection
    users_collection = db['users']
    user_count = users_collection.count_documents({})
    print(f" Users collection has {user_count} documents")

    # Check admin password
    admin_user = users_collection.find_one({'username': 'admin'})
    if admin_user:
        print(f" Admin password_hash: {admin_user.get('password_hash')}")
    else:
        print(" Admin user not found")

except ServerSelectionTimeoutError as e:
    print(f" Connection timeout: {e}")
    print("Possible issues:")
    print("- Invalid credentials")
    print("- Network connectivity")
    print("- MongoDB Atlas IP whitelist")
except Exception as e:
    print(f" Connection failed: {e}")
    print(f"Error type: {type(e).__name__}")