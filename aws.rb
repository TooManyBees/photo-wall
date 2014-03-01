require 'aws-sdk-core'
require 'JSON'

module AwsConnection

  S3 = Aws.s3

  def self.get_buckets
    S3.list_buckets.buckets.map(&:name)
  end

  def self.get_images bucket
    images = S3.list_objects(bucket: bucket).contents.map(&:key)
    images.map { |i| url_for(bucket, i) }
  end

  def self.upload_image bucket, image
    key = File.basename(image)
    ext = image.split('.').last
    File.open(image) do |img|
      obj = S3.put_object(
        acl: 'public-read',
        body: img,
        bucket: bucket,
        key: key,
        content_type: "image/#{ext}"
      )
      url_for(bucket, key)
    end
  end

  private
  def self.url_for(bucket, key)
    "https://#{bucket}.s3.amazonaws.com/#{key}"
  end
end
