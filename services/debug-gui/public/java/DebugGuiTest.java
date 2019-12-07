package com.userSrvc.client.util;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

public class DebugGuiTest {
	private final int PARENT_ID = Integer.MAX_VALUE;

	public class DebugThreads implements Runnable {
		private Boolean debug;
		private int limit = 4;
		private String id;
		private boolean shouldInit = true;

		public DebugThreads(int index, boolean debug) {
			this.debug = debug;
			id = this.getClass().getSimpleName() + "-" + index;
		}

		public DebugThreads(int index, boolean debug, boolean shouldInit) {
			this(index, debug);
			this.shouldInit = shouldInit;
		}

		@Override
		public void run() {
			if (shouldInit) {
				DebugGui.init(debug, id);
			}
			int current = 0;
			while (limit > current) {
				System.out.println(debug + "==" + DebugGui.debugging());
				System.out.println(id + "==" + DebugGui.getId());
				assert(debug.equals(DebugGui.debugging()));
				assert(this.id.equals(DebugGui.getId()));
				try {
					Thread.sleep((long)Math.floor(Math.random() * 3000));
					log();
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				current++;
			}
		}

	}

	List<Thread> threads = new ArrayList<Thread>();

	@Test
	public void threadCheck() {
		DebugGui.setHost("https://www.jozsefmorrissey.com/debug-gui");
		for (int i = 0; i < 10; i++) {
			boolean debug = Math.random() < .5;
			threads.add(new Thread(new DebugThreads(i, debug)));
			threads.get(i).start();
		}
		for (int i = 0; i < 10; i++) {
			try {
				threads.get(i).join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
		inheritanceThreadCheck(true, 10);
		inheritanceThreadCheck(false, 20);
	}

	public void inheritanceThreadCheck(boolean debug, int startIndex) {
		DebugGui.setHost("https://www.jozsefmorrissey.com/debug-gui");
		DebugGui.init(debug, "DebugThreads-" + PARENT_ID);

		for (int i = startIndex; i < startIndex + 10; i++) {
			threads.add(new Thread(new DebugThreads(PARENT_ID, DebugGui.debugging(), false)));
			threads.get(i).start();
		}
		for (int i = startIndex; i < startIndex + 10; i++) {
			try {
				threads.get(i).join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}


	public void log() throws InterruptedException {
		DebugGui.setRoot(DebugGui.getId());
		DebugGui.link("beta", "mylabel", "http://www.google.com")
			.link("delta.foxtrot", "my2ndlabel", "http://www.google.com")
			.value("beta.charlie", "mylabel", "http://www.google.com")
			.log("beta.charlie", "mylog1: http://www.google.com")
			.log("beta.charlie", "mylog2: http://www.google.com")
			.log("beta.charlie", "mylog3: http://www.google.com")
			.log("beta.charlie", "mylog4: http://www.google.com")
			.exception("beta.charlie.echo", "myException", new Error("my message"));

		// Check below url for results
		// https://www.jozsefmorrissey.com/debug-gui/html/debug-gui-client-example.html?DebugGui.debug=t&DebugGui.ids=DebugThreads-0,DebugThreads-1,DebugThreads-2,DebugThreads-3,DebugThreads-4,DebugThreads-5,DebugThreads-6,DebugThreads-7,DebugThreads-8,DebugThreads-9
	}
}
