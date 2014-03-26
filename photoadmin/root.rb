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
  try_s3 { JSON.dump(AwsConnection.get_all_images(bucket)) }
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

post '/api/buckets/:bucket' do
  file = params[:files].first
  p file

  if AwsConnection.item_exists?(bucket: params[:bucket], item: file[:filename])
    halt 422, {"Content-Type" => "text/json"}, JSON.dump(
      {
        filename: file[:filename],
        error: "A file already exists by this name."
      }
    )
  end

  result = try_s3 do
    AwsConnection.upload_image(
      bucket: params[:bucket],
      name: file[:filename],
      source: file[:tempfile]
    )
  end

  JSON.dump(filename: file[:filename], src: result)

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
  halt 404 unless AwsConnection.bucket_exists? bucket
  walls = AwsConnection.get_saved_walls(bucket)
  photos = AwsConnection.get_all_images(bucket)
  haml :bucket_show, locals: {bucket: bucket, images: photos, walls: walls}
end

get '/walls/:bucket/build/?' do
  bucket = params[:bucket]
  halt 404 unless AwsConnection.bucket_exists? bucket
  images = AwsConnection.get_all_images(bucket)
  haml :bucket_build, locals: {bucket: bucket, images: images, presets: Hash.new({})}
end

get '/walls/:bucket/edit/:wall' do
  bucket = params[:bucket]
  halt 404 unless AwsConnection.bucket_exists? bucket
  # halt 404 unless AwsConnection.wall_exists? params[:wall]
  images = AwsConnection.get_all_images(bucket)
  presets = AwsConnection.get_wall(bucket: bucket, wall: params[:wall])
  haml :bucket_build, locals: {bucket: bucket, images: images, presets: presets}
end

get '/test/?' do
  erb :index, locals: {remote_json: params[:src], show_embed_code: true}
end

get '/*.*' do
  send_file File.join(settings.public_folder, params[:splat].join("."))
end

get '/' do
  erb :index, locals: {remote_json: 'kitty.json'}
end

helpers do
  def h output
    Rack::Utils.escape_html output
  end

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
