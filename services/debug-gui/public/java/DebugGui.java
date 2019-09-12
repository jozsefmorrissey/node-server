package com.userSrvc.client.util;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.exception.ExceptionUtils;
import org.springframework.http.HttpHeaders;

import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class DebugGui {

	public static void main(String...args) {
		DebugGui.setHost("https://www.jozsefmorrissey.com/debug-gui");

		DebugGui debugGui = new DebugGui(true);
		debugGui.link("beta", "mylabel", "http://www.google.com");
		debugGui.link("delta.foxtrot", "my2ndlabel", "http://www.google.com");
		debugGui.value("beta.charlie", "mylabel", "http://www.google.com");
		debugGui.log("beta.charlie", "mylog1: http://www.google.com");
		debugGui.log("beta.charlie", "mylog2: http://www.google.com");
		debugGui.log("beta.charlie", "mylog3: http://www.google.com");
		debugGui.log("beta.charlie", "mylog4: http://www.google.com");
		debugGui.exception("beta.charlie.echo", "myException", new Error("my message"));
	}

	private static String DEBUG_ID = "DebugGui.debug";

	private static String httpHost = "http://www.jozsefmorrissey.com/debug-gui/";
	private static String httpsHost = "https://www.jozsefmorrissey.com/debug-gui/";
	private static String root = "DebugGui";
	private static String id = "Default";

	private boolean debug = false;


	public DebugGui(boolean debug) {
		this.debug = debug;
	}

  public DebugGui(HttpServletRequest req) {
  	if (req.getHeader(DEBUG_ID) != null) {
  		debug = true;
  	} else {
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
		    for (Cookie cookie : cookies) {
		    	if (cookie.getName().equals(DEBUG_ID)) {
		    		debug = true;
		    	}
		    }
        }
  	}
  }

	private static class Worker implements Runnable {
		String type;
		String group;
		Object obj;

		private Worker(String type, String group, Object obj) {
			this.type = type;
			this.group = group;
			this.obj = obj;
		}

		private static void dispatch(String type, String group, Object obj) {
			Runnable runnable = new Worker (type, group, obj);
			Thread thread = new Thread(runnable);
			thread.start();
		}

		@Override
		public void run() {
			restPostCall(getUrl(type, getId(), getGroup(group), obj);
			logObject(obj, group);
		}
	}

	public static void setHost(String host) {
		DebugGui.httpHost = host;
	}

	public static void setRoot(String root) {
		DebugGui.root = root;
	}

	public static void setId(String id) {
		DebugGui.id = id;
	}

	private String toJson(Object obj) {
	      ObjectMapper mapper = new ObjectMapper();
	      try
	      {
	         return mapper.writeValueAsString(obj);
	      } catch (JsonGenerationException e)
	      {
	         e.printStackTrace();
	      } catch (JsonMappingException e)
	      {
	         e.printStackTrace();
	      } catch (IOException e)
	      {
	         e.printStackTrace();
	      }
	      return "{}";
	}

	public static void value(String group, Object obj) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			String json = mapper.writeValueAsString(obj);
			HashMap<String, Object> result = new ObjectMapper().readValue(json, HashMap.class);
			for (String key : result.keySet()) {
				value (group, key, result.get(key));
			}
		} catch (IOException e) {
			exception(group, "Mapping ObjectError", new Error("Failed to map object values"));
		}
	}


	private String getUrl(String ext, String id, String group) {
		return getUrl(ext, id) + "/" + group;
	}

	private String getUrl(String ext, String id) {
		return host + (host.endsWith("/") ? "" : "/") + ext + "/" + id;
	}

	private class Link {
		public String label;
		public String url;
		public Link(String label, String url) {
			this.label = label;
			this.url = url;
		}
		public String toString() {
			return toJson(this);
		}
	}

	private class Value {
		public String key;
		public String value;
		public Value(String key, String value) {
			this.key = key;
			this.value = value;
		}
		public String toString() {
			return toJson(this);
		}
	}

	private class Exception {
		public String id;
		public String msg;
		public String stacktrace;
		public Exception(String id, String msg, String stacktrace) {
			this.id = id;
			this.msg = msg;
			this.stacktrace = stacktrace;
		}
		public String toString() {
			return toJson(this);
		}
	}

	private class Log {
		public String log;
		public Log(String log) {
			this.log = log;
		}
		public String toString() {
			return toJson(this);
		}
	}

	private static void restPostCall(String uri, Object obj) {
		try {
			URL url = new URL(uri);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setRequestProperty("Content-Type","application/json");
			con.setConnectTimeout(2000);

			byte[] outputInBytes = obj.toString().getBytes("UTF-8");
			con.setRequestProperty("Content-Length", "" + Integer.toString(outputInBytes.length));
			OutputStream os = con.getOutputStream();
			os.write( outputInBytes );
			os.close();

			con.getResponseCode();
			con.disconnect();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private void logObject(Object obj, String group) {
		String groupStr = " (" + getId() + "/" + getGroup(group) + ")";
		String logStr = "DebugGuiLog - " + obj.toString + groupStr;
		log.debug(logStr);
	}

	public DebugGui link(String group, String label, String url) {
		if (!shouldDebug()) return this;
		Link obj = new Link(label, url);
		Worker.dispatch("link", group, obj);
		return this;
	}
	public DebugGui value(String group, String key, Object value) {
		if (!shouldDebug()) return this;
		Value obj = new Value(key, value);
		Worker.dispatch("value", group, obj);
		return this;
	}
	public DebugGui exception(String group, String errorId, Throwable error) {
		if (!shouldDebug()) return this;
		Exception obj = new Exception(errorId, error);
		Worker.dispatch("exception", group, obj);
		return this;
	}
	public DebugGui log(String group, String log) {
		if (!shouldDebug()) return this;
		Log obj = new Log(log);
		Worker.dispatch("log", group, obj);
		return this;
	}

	private String getId() {
		return id;
	}

	private String getGroup(String minor) {
		return root + "." + minor;
	}

	private boolean shouldDebug() {
		return debug;
	}

    public static void addCookie(HttpServletResponse response) {
    	if (response != null) {
		    Cookie cookie = new Cookie(DEBUG_ID, "true");
		    cookie.setMaxAge(60 * 60);
		    response.addCookie(cookie);
    	}

    }

	public void addHeader(HttpHeaders httpHeaders) {
	    if (debug) {
	    	httpHeaders.add(DEBUG_ID, "true");
	    }
	}
}
