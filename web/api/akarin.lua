function EffectiveMethod(qs)
  local method=mg.get_var(qs,'_method') and mg.get_var(qs,'_method'):upper() or mg.request_info.request_method
  if method~='GET' then
    for k,v in pairs(mg.request_info.http_headers) do
      if k:lower()=='x-requested-with' and v:lower()=='xmlhttprequest' then
        return method
      end
    end
    return '!'..method
  end
  return method
end

function Category(nibble)
  return ({'news','sports','information','drama','music','variety','cinema','anime','information','cinema'})[math.floor(nibble/256)+1] or 'etc'
end

function UnixTime(time)
  return os.time(time)*1000
end

function NetworkType(onid)
  return onid==4 and 'BS' or (onid==6 or onid==7) and 'CS' or (0x7880<=onid and onid<=0x7fef) and 'GR' or 'EX'
end

function JsonEscape(s)
  return s:gsub('[\n\r\t]',''):gsub('[\\"]','\\%0')
end

function TrimFlags(s)
  local flags={}
  for i,v in ipairs({'新','終','再','字','解','デ','双','二','多'}) do
    local n,m
    s,n=s:gsub('%['..v..'%]','')
    s,m=s:gsub('【'..v..'】','')
    if n~=0 or m~=0 then
      table.insert(flags,v)
    end
  end
  return s,flags
end

--ドキュメントルートへの相対パスを取得する
function PathToRoot()
  return ('../'):rep(#mg.script_name:gsub('[^\\/]*[\\/]+[^\\/]*','N')-#(mg.document_root..'/'):gsub('[^\\/]*[\\/]+','N'))
end

--OSの絶対パスをドキュメントルートからの相対パスに変換する
function NativeToDocumentPath(path)
  local root=(mg.document_root..'/'):gsub('[\\/]+','/')
  if path:gsub('[\\/]+','/'):sub(1,#root):lower()==root:lower() then
    return path:gsub('[\\/]+','/'):sub(#root+1)
  end
end

--レスポンスを生成する
function Response(code,ctype,charset,cl)
  return 'HTTP/1.1 '..code..' '..mg.get_response_code_text(code)
    ..(ctype and '\r\nX-Content-Type-Options: nosniff\r\nContent-Type: '..ctype..(charset and '; charset='..charset or '') or '')
    ..(cl and '\r\nContent-Length: '..cl or '')
    ..(mg.keep_alive(not not cl) and '\r\n' or '\r\nConnection: close\r\n')
end

--可能ならコンテンツをzlib圧縮する(lua-zlib(zlib.dll)が必要)
function Deflate(ct)
  local zl
  local trim
  for k,v in pairs(mg.request_info.http_headers) do
    if not zl and k:lower()=='accept-encoding' and v:lower():find('deflate') then
      local status, zlib = pcall(require, 'zlib')
      if status then
        zl=zlib.deflate()(ct, 'finish')
      end
    elseif k:lower()=='user-agent' and (v:find(' MSIE ') or v:find(' Trident/7%.') or v:find(' Edge/')) then
      --RFC2616非準拠のブラウザはzlibヘッダを取り除く
      trim=true
    end
  end
  if trim and zl and #zl >= 6 then
    zl=zl:sub(3, #zl-4)
  end
  return zl
end

--POSTメッセージボディをすべて読む
function ReadPost()
  local post, s
  if mg.request_info.request_method=='POST' then
    post=''
    repeat
      s=mg.read()
      post=post..(s or '')
    until not s
    if #post~=mg.request_info.content_length then
      post=nil
    end
  end
  return post
end
