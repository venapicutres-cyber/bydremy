import os
import shutil
import time

start_time = time.time()
print("Starting asset preparation for public directory...")

source_backup = "BYDREAMY_FULL_BACKUP"
target_public = "public"
os.makedirs(target_public, exist_ok=True)

categories = ["images", "fonts", "css", "js", "videos"]
copied_count = 0
skipped_count = 0

for cat in categories:
    cat_dir = os.path.join(source_backup, cat)
    if not os.path.exists(cat_dir):
        continue
    
    for root, dirs, files in os.walk(cat_dir):
        for f in files:
            src_file = os.path.join(root, f)
            rel_path = os.path.relpath(src_file, cat_dir)
            dest_file = os.path.join(target_public, rel_path)
            
            os.makedirs(os.path.dirname(dest_file), exist_ok=True)
            if not os.path.exists(dest_file):
                shutil.copy2(src_file, dest_file)
                copied_count += 1
            else:
                skipped_count += 1

# Also copy audio/video files if any
videos_dir = os.path.join(source_backup, "videos")
if os.path.exists(videos_dir):
    for root, dirs, files in os.walk(videos_dir):
        for f in files:
            src_file = os.path.join(root, f)
            rel_path = os.path.relpath(src_file, videos_dir)
            dest_file = os.path.join(target_public, rel_path)
            os.makedirs(os.path.dirname(dest_file), exist_ok=True)
            if not os.path.exists(dest_file):
                shutil.copy2(src_file, dest_file)
                copied_count += 1

elapsed = time.time() - start_time
print(f"Asset preparation finished in {elapsed:.2f}s. Copied: {copied_count}, Skipped: {skipped_count}")
