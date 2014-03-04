require 'sinatra'
require 'sinatra/content_for'
require 'haml'
require 'json'
require 'aws-sdk-core'
require './aws.rb'

get '/api/buckets/?' do
  JSON.dump(AwsConnection.get_buckets)
end

get '/api/buckets/:bucket' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.get_images(bucket)) }
end

get '/api/buckets/:bucket/saved' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.get_saved_walls(bucket)) }
end

post '/api/buckets/?' do
  begin
    bucket = params[:bucket]
    validate_bucket_name! bucket # Potentially throws a 422 itself
    JSON.dump(AwsConnection.create_bucket(bucket))
  rescue Aws::S3::Errors::InvalidBucketName
    four_twenty_two "Bucket name \"#{bucket}\" is not valid"
  rescue Aws::S3::Errors::BucketAlreadyExists
    four_twenty_two "Bucket #{bucket} already exists."
  end
end

put '/api/buckets/:bucket' do
  # one-by-one upload to aws and return location
  halt 400
end

post '/api/save/:bucket/?' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.save_json(bucket, params[:json])) }
end

get '/walls/?' do
  buckets = AwsConnection.get_buckets
  buckets.map! do |bucket|
    walls = AwsConnection.get_saved_walls(bucket)
    {name: bucket, walls: walls}
  end
  haml :buckets_list, locals: {buckets: buckets}
end

get '/walls/:bucket/?' do
  bucket = params[:bucket]
  halt 404 unless AwsConnection.exists? bucket
  photos = AwsConnection.get_images(bucket)
  haml :bucket_show, locals: {bucket: bucket, images: photos}
end

get '/walls/:bucket/build/?' do
  bucket = params[:bucket]
  halt 404 unless AwsConnection.exists? bucket
  images = AwsConnection.get_images(bucket)
  haml :bucket_build, locals: {bucket: bucket, images: images}
end

get '/walls/:bucket/upload/?' do
  bucket = params[:bucket]
  halt 404 unless AwsConnection.exists? bucket
  haml :upload, locals: {bucket: bucket}
end

get '/buildjson/?' do
  buckets = AwsConnection.get_buckets
  haml :build, locals: {buckets: buckets}
end

get '/upload/?' do
  haml :upload
end

get '/test/?' do
  haml :index, locals: {remote_json: params[:src]}
end

get '/*.*' do
  send_file File.join(settings.public_folder, params[:splat].join("."))
end

get '/' do
  haml :index, locals: {remote_json: 'kitty.json'}
end

helpers do
  def four_oh_four bucket=nil
    halt 404, {"Content-Type" => "application/json"}, JSON.dump(error: "Bucket not found")
  end

  def four_twenty_two message
    halt 422, {'Content-Type' => 'application/json'}, JSON.dump(error: message)
  end

  def try_s3 &blk
    begin
      yield blk
    rescue Aws::S3::Errors::NoSuchBucket
      four_oh_four
    rescue Aws::S3::Errors::AccessDenied
      four_oh_four
    end
  end

  def validate_bucket_name! bucket
    invalid = invalid_bucket_name? bucket
    if invalid
      four_twenty_two invalid
    end
  end

  def invalid_bucket_name? bucket
    return "Bucket name can not be empty" if bucket.empty?
    # return "Bucket name can not end in a dot" if bucket.end_with? "."
    # return "Bucket name can not have 2 dots in a row" if bucket.include? ".."
    bucket.each_char do |c|
      return "Bucket name contains invalid character \"#{c}\"" unless c =~ /[a-z0-9_\-]/i
    end
    return false
  end
end
