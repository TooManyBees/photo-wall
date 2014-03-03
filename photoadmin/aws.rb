require 'aws-sdk-core'
require 'mime/types'
require 'json'

module AwsConnection

  S3 = Aws.s3
  PIC_EXTENSIONS = %w[
    bm bmp pbm
    gif
    ico
    jfif jpe jpeg jpg pjpeg
    pcx
    pct pic pict
    png x-png
    tif tiff
  ]

  def self.get_buckets
    S3.list_buckets.buckets
      .map(&:name)
      .select{ |name| name.start_with? "pw-" }
  end

  def self.get_images bucket
    S3.list_objects(bucket: bucket).contents
      .map(&:key)
      .select { |key| PIC_EXTENSIONS.include? key.split('.').last }
      .map { |i| url_for(bucket, i) }
  end

  def self.get_saved_walls bucket
    S3.list_objects(bucket: bucket).contents
      .map(&:key)
      .select { |key| key.end_with? '.json' }
      .map { |i| url_for(bucket, i) }
  end

  def self.save_json bucket, json
    key = "#{bucket}-#{Time.now.to_i}.json"
    S3.put_object(
      acl: 'public-read',
      body: json,
      bucket: bucket,
      key: key,
      content_type: "text/json"
    )
    {url: url_for(bucket, key)}
  end

  def self.upload_image bucket, image
    key = File.basename(image)
    mime = MIME::Types.of(key).first.simplified
    ext = image.split('.').last
    File.open(image) do |img|
      obj = S3.put_object(
        acl: 'public-read',
        body: img,
        bucket: bucket,
        key: key,
        content_type: mime
      )
      url_for(bucket, key)
    end
  end

  private
  def self.url_for(bucket, key)
    "https://#{bucket}.s3.amazonaws.com/#{key}"
  end
end
