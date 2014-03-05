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
  BUCKET_PREFIX = 'hplabs-pw-'

  def self.exists? bucket
    S3.head_bucket(bucket: prefixed(bucket))
  rescue Aws::Errors::ServiceError
    false
  else
    true
  end

  def self.get_buckets
    S3.list_buckets.buckets
      .map(&:name)
      .select{ |name| name.start_with? BUCKET_PREFIX }
      .map{ |name| name[/(?<=\A#{BUCKET_PREFIX}).+$/] }
  end

  def self.create_bucket bucket
    bucket = prefixed(bucket)
    response = S3.create_bucket(
      acl: 'public-read',
      bucket: bucket
    )
    S3.put_bucket_cors(
      bucket: bucket,
      cors_configuration: {
        cors_rules: [
          {
            allowed_headers: ["Authorization"],
            allowed_methods: ["GET"],
            allowed_origins: ["*"],
            max_age_seconds: 3000
          }
        ]
      }
    )
    location = response[:location][/(?<=\A\/#{BUCKET_PREFIX}).+$/]
    {name: location}
  end

  def self.get_all_images bucket
    get_images(bucket) + get_external_images(bucket)
  end

  def self.get_images bucket
    bucket = prefixed(bucket)
    S3.list_objects(bucket: bucket).contents
      .map(&:key)
      .select { |key| PIC_EXTENSIONS.include? key.split('.').last }
      .map { |i| url_for(bucket, i) }
  end

  def self.get_external_images bucket
    bucket = prefixed(bucket)
    string_io = S3.get_object(bucket: bucket, key: "external_images.json").body
    string_io.rewind
    JSON.parse(string_io.read)
  rescue Aws::S3::Errors::NoSuchKey
    []
  rescue Aws::S3::Errors::NoSuckBucket
    [] # TODO: pick a good erorr message for this
  end

  def self.get_saved_walls bucket
    bucket = prefixed(bucket)
    S3.list_objects(bucket: bucket).contents
      .map(&:key)
      .select { |key| key.end_with? '.json' && key != 'external_images.json' }
      .map { |i| url_for(bucket, i) }
  end

  def self.save_json bucket, json
    bucket = prefixed(bucket)
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
    bucket = prefixed(bucket)
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

  def self.prefixed(bucket)
    BUCKET_PREFIX+bucket
  end
end
