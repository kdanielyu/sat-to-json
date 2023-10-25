# Satellite image to ThreeJS browser preview

Notes:
- 'img_roboflow' notebook has script to infer local image through API
  - Image needs to be 640x640 pixels.
  - Update API key to your own roboflow key.
- <code>!pip install roboflow</code>
<br><br>
Json preview:
- Run server to serve html file. - <code>python3 -m http.server 8000</code>
<br><br>

- yolov5 has trained models for local server inference.
  - Clone from github
    - <code>git clone https://github.com/ultralytics/yolov5.git
    - cd yolov5 
    - pip install -U -r requirements.txt</code>
  - Download and copy 'runs' folder into yolov5 <a href='https://unsw-my.sharepoint.com/:u:/g/personal/z3466300_ad_unsw_edu_au/EUOioAI04FJFghOBrS9A6TsBDGGJcauVYUrWA7K0xL2UeQ?e=8VxhHZ'>download link</a> > yolov5/runs contains both training and prediction models
  - 'local-infer' notebook has examples of inference using yolov5

